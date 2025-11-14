"""
Data Collection Service for AI Training Data

This service handles collection, compression, archiving, and export of AI interactions
for training custom models. It implements a hybrid storage approach:
- Recent data (configurable, default 30 days) in Supabase for fast access
- Old data archived to Cloudflare R2 / AWS S3 for cost-effective long-term storage

Key Features:
- Automatic compression for large workflows (>10KB)
- JSONL export in OpenAI fine-tuning format
- S3-compatible storage (works with Cloudflare R2, AWS S3, MinIO, etc.)
- Comprehensive storage statistics and cost tracking
"""

import gzip
import json
import logging
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from io import BytesIO
import uuid

import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from supabase import Client

from app.core.config import settings

logger = logging.getLogger(__name__)


class DataCollector:
    """
    Handles collection and archiving of AI interaction data for model training.
    
    This class provides comprehensive data collection capabilities including:
    - Logging conversations with automatic compression
    - Tracking validation results and user feedback
    - Archiving old data to S3-compatible storage
    - Exporting training datasets in various formats
    - Monitoring storage usage and costs
    """
    
    def __init__(self, supabase_client: Client):
        """
        Initialize the DataCollector.
        
        Args:
            supabase_client: Supabase client for database operations
        """
        self.supabase = supabase_client
        self.compression_threshold_bytes = settings.compression_threshold_kb * 1024
        self.s3_client = None
        
        # Initialize S3 client if configured
        if settings.s3_configured:
            try:
                self.s3_client = boto3.client(
                    's3',
                    endpoint_url=settings.s3_endpoint,
                    aws_access_key_id=settings.s3_access_key,
                    aws_secret_access_key=settings.s3_secret_key,
                    region_name=settings.s3_region,
                )
                logger.info("S3 client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize S3 client: {e}")
                self.s3_client = None
        else:
            logger.warning("S3 not configured - archiving will be disabled")
    
    def _compress_data(self, data: Dict) -> Tuple[str, int, int]:
        """
        Compress data using gzip and return as hex string.
        
        Args:
            data: Data to compress
            
        Returns:
            Tuple of (hex_string, original_size, compressed_size)
        """
        # Convert to JSON
        json_str = json.dumps(data, separators=(',', ':'))
        original_size = len(json_str.encode('utf-8'))
        
        # Compress
        compressed = gzip.compress(json_str.encode('utf-8'), compresslevel=9)
        compressed_size = len(compressed)
        
        # Convert to hex string for database storage
        hex_string = compressed.hex()
        
        compression_ratio = (1 - compressed_size / original_size) * 100
        logger.debug(f"Compressed {original_size} bytes to {compressed_size} bytes "
                    f"({compression_ratio:.1f}% reduction)")
        
        return hex_string, original_size, compressed_size
    
    def _decompress_data(self, hex_string: str) -> Dict:
        """
        Decompress data from hex string.
        
        Args:
            hex_string: Hex-encoded compressed data
            
        Returns:
            Decompressed data as dictionary
        """
        # Convert from hex
        compressed = bytes.fromhex(hex_string)
        
        # Decompress
        decompressed = gzip.decompress(compressed)
        
        # Parse JSON
        return json.loads(decompressed.decode('utf-8'))
    
    async def log_conversation(
        self,
        user_message: str,
        ai_response: str,
        platform: str,
        user_id: Optional[str] = None,
        intent_extracted: Optional[str] = None,
        workflow_generated: Optional[Dict] = None,
        success: bool = True,
        error_message: Optional[str] = None,
        processing_time_ms: Optional[int] = None,
        model_version: Optional[str] = None,
    ) -> Optional[str]:
        """
        Log a conversation interaction for training data collection.
        
        This method automatically compresses large workflows (>10KB) and stores
        all interaction details for future model training.
        
        Args:
            user_message: The user's input message
            ai_response: The AI's response
            platform: Target platform (n8n, make, zapier)
            user_id: Optional user ID
            intent_extracted: Extracted user intent
            workflow_generated: Generated workflow JSON
            success: Whether the interaction was successful
            error_message: Error message if failed
            processing_time_ms: Processing time in milliseconds
            model_version: Model version used
            
        Returns:
            Interaction ID if successful, None otherwise
        """
        if not settings.enable_data_collection:
            logger.debug("Data collection is disabled")
            return None
        
        try:
            interaction_id = str(uuid.uuid4())
            
            # Calculate size
            workflow_json = json.dumps(workflow_generated) if workflow_generated else None
            workflow_size = len(workflow_json.encode('utf-8')) if workflow_json else 0
            
            # Determine if compression is needed
            should_compress = workflow_size > self.compression_threshold_bytes
            
            workflow_data = None
            workflow_compressed = None
            is_compressed = False
            
            if workflow_generated:
                if should_compress:
                    # Compress the workflow
                    hex_string, original_size, compressed_size = self._compress_data(workflow_generated)
                    workflow_compressed = hex_string
                    is_compressed = True
                    workflow_size = original_size
                    logger.info(f"Compressed workflow from {original_size} to {compressed_size} bytes")
                else:
                    # Store uncompressed
                    workflow_data = workflow_generated
            
            # Prepare record
            record = {
                'interaction_id': interaction_id,
                'user_id': user_id,
                'user_message': user_message,
                'ai_response': ai_response,
                'intent_extracted': intent_extracted,
                'workflow_generated': workflow_data,
                'workflow_compressed': workflow_compressed,
                'is_compressed': is_compressed,
                'platform': platform,
                'success': success,
                'error_message': error_message,
                'user_feedback': 'none',
                'size_bytes': workflow_size,
                'processing_time_ms': processing_time_ms,
                'model_version': model_version or 'current',
                'created_at': datetime.utcnow().isoformat(),
            }
            
            # Insert into database
            result = self.supabase.table('training_data').insert(record).execute()
            
            logger.info(f"Logged conversation {interaction_id} for platform {platform} "
                       f"(compressed: {is_compressed}, size: {workflow_size} bytes)")
            
            return interaction_id
            
        except Exception as e:
            logger.error(f"Failed to log conversation: {e}", exc_info=True)
            return None
    
    async def log_workflow_validation(
        self,
        training_data_id: Optional[str],
        workflow_id: str,
        platform: str,
        validation_passed: bool,
        validation_score: Optional[float] = None,
        errors: Optional[List[Dict]] = None,
        warnings: Optional[List[Dict]] = None,
        user_edited: bool = False,
        original_workflow: Optional[Dict] = None,
        edited_workflow: Optional[Dict] = None,
        edit_diff: Optional[Dict] = None,
        validator_version: Optional[str] = None,
        validation_time_ms: Optional[int] = None,
    ) -> Optional[str]:
        """
        Log workflow validation results.
        
        Args:
            training_data_id: Associated training data ID
            workflow_id: Workflow identifier
            platform: Target platform
            validation_passed: Whether validation passed
            validation_score: Validation score (0-100)
            errors: List of validation errors
            warnings: List of validation warnings
            user_edited: Whether user edited the workflow
            original_workflow: Original workflow before edits
            edited_workflow: Edited workflow
            edit_diff: Diff of changes made
            validator_version: Validator version
            validation_time_ms: Validation time in milliseconds
            
        Returns:
            Validation log ID if successful, None otherwise
        """
        if not settings.enable_data_collection:
            return None
        
        try:
            record = {
                'training_data_id': training_data_id,
                'workflow_id': workflow_id,
                'platform': platform,
                'validation_passed': validation_passed,
                'validation_score': validation_score,
                'errors': errors or [],
                'warnings': warnings or [],
                'user_edited': user_edited,
                'original_workflow': original_workflow,
                'edited_workflow': edited_workflow,
                'edit_diff': edit_diff,
                'validator_version': validator_version or 'current',
                'validation_time_ms': validation_time_ms,
                'created_at': datetime.utcnow().isoformat(),
            }
            
            result = self.supabase.table('validation_logs').insert(record).execute()
            
            log_id = result.data[0]['id'] if result.data else None
            logger.info(f"Logged validation for workflow {workflow_id} "
                       f"(passed: {validation_passed}, edited: {user_edited})")
            
            return log_id
            
        except Exception as e:
            logger.error(f"Failed to log validation: {e}", exc_info=True)
            return None
    
    async def log_user_feedback(
        self,
        interaction_id: str,
        feedback_type: str,
        user_id: Optional[str] = None,
        feedback_text: Optional[str] = None,
        sentiment_score: Optional[int] = None,
        corrected_workflow: Optional[Dict] = None,
        correction_notes: Optional[str] = None,
        issue_category: Optional[str] = None,
        user_agent: Optional[str] = None,
        session_id: Optional[str] = None,
    ) -> Optional[str]:
        """
        Log explicit user feedback.
        
        This is the most valuable data for training as it includes direct user input.
        
        Args:
            interaction_id: Associated interaction ID
            feedback_type: Type of feedback (thumbs_up, thumbs_down, edit, report)
            user_id: User ID
            feedback_text: Feedback text
            sentiment_score: Sentiment score (1-5)
            corrected_workflow: User's corrected workflow
            correction_notes: Notes about corrections
            issue_category: Category of issue reported
            user_agent: User agent string
            session_id: Session ID
            
        Returns:
            Feedback ID if successful, None otherwise
        """
        if not settings.enable_data_collection:
            return None
        
        try:
            # Get training_data_id from interaction_id
            result = self.supabase.table('training_data').select('id').eq(
                'interaction_id', interaction_id
            ).execute()
            
            training_data_id = result.data[0]['id'] if result.data else None
            
            if not training_data_id:
                logger.warning(f"No training data found for interaction {interaction_id}")
                return None
            
            # Insert feedback
            feedback_record = {
                'interaction_id': interaction_id,
                'training_data_id': training_data_id,
                'user_id': user_id,
                'feedback_type': feedback_type,
                'feedback_text': feedback_text,
                'sentiment_score': sentiment_score,
                'corrected_workflow': corrected_workflow,
                'correction_notes': correction_notes,
                'issue_category': issue_category,
                'user_agent': user_agent,
                'session_id': session_id,
                'created_at': datetime.utcnow().isoformat(),
            }
            
            result = self.supabase.table('user_feedback').insert(feedback_record).execute()
            
            # Update training_data with feedback
            self.supabase.table('training_data').update({
                'user_feedback': feedback_type,
                'feedback_text': feedback_text,
            }).eq('interaction_id', interaction_id).execute()
            
            feedback_id = result.data[0]['id'] if result.data else None
            logger.info(f"Logged user feedback for interaction {interaction_id} "
                       f"(type: {feedback_type})")
            
            return feedback_id
            
        except Exception as e:
            logger.error(f"Failed to log user feedback: {e}", exc_info=True)
            return None
    
    async def archive_old_data(self, days_old: int = 30) -> Dict[str, Any]:
        """
        Archive old training data to S3/R2 storage.
        
        This moves data older than the specified days from Supabase to S3/R2,
        significantly reducing storage costs while keeping data accessible.
        
        Args:
            days_old: Archive data older than this many days (default: 30)
            
        Returns:
            Dictionary with archiving statistics
        """
        if not self.s3_client:
            logger.warning("S3 client not configured - cannot archive data")
            return {
                'success': False,
                'error': 'S3 not configured',
                'archived_count': 0,
            }
        
        try:
            logger.info(f"Starting archival of data older than {days_old} days...")
            
            cutoff_date = datetime.utcnow() - timedelta(days=days_old)
            
            # Get data to archive
            result = self.supabase.table('training_data').select('*').lt(
                'created_at', cutoff_date.isoformat()
            ).is_('archived_at', 'null').execute()
            
            if not result.data:
                logger.info("No data to archive")
                return {
                    'success': True,
                    'archived_count': 0,
                    'message': 'No data to archive'
                }
            
            records = result.data
            logger.info(f"Found {len(records)} records to archive")
            
            # Group by platform and date
            archives_by_platform = {}
            for record in records:
                platform = record['platform']
                created_date = datetime.fromisoformat(record['created_at'].replace('Z', '+00:00')).date()
                
                key = f"{platform}_{created_date}"
                if key not in archives_by_platform:
                    archives_by_platform[key] = {
                        'platform': platform,
                        'date': created_date,
                        'records': []
                    }
                archives_by_platform[key]['records'].append(record)
            
            # Archive each group
            archived_stats = []
            total_archived = 0
            
            for key, archive_data in archives_by_platform.items():
                platform = archive_data['platform']
                date = archive_data['date']
                records_to_archive = archive_data['records']
                
                # Convert to JSONL format
                jsonl_lines = []
                for record in records_to_archive:
                    # Decompress if needed
                    if record.get('is_compressed') and record.get('workflow_compressed'):
                        try:
                            record['workflow_generated'] = self._decompress_data(
                                record['workflow_compressed']
                            )
                            record['workflow_compressed'] = None
                            record['is_compressed'] = False
                        except Exception as e:
                            logger.error(f"Failed to decompress record {record['id']}: {e}")
                    
                    jsonl_lines.append(json.dumps(record))
                
                jsonl_content = '\n'.join(jsonl_lines)
                
                # Compress the entire archive
                compressed_content = gzip.compress(jsonl_content.encode('utf-8'), compresslevel=9)
                uncompressed_size = len(jsonl_content.encode('utf-8'))
                compressed_size = len(compressed_content)
                
                # Upload to S3
                s3_key = f"archives/{platform}/{date.year}/{date.month:02d}/{date}.jsonl.gz"
                
                try:
                    self.s3_client.put_object(
                        Bucket=settings.s3_bucket_name,
                        Key=s3_key,
                        Body=compressed_content,
                        ContentType='application/gzip',
                        Metadata={
                            'platform': platform,
                            'date': str(date),
                            'records_count': str(len(records_to_archive)),
                            'uncompressed_size': str(uncompressed_size),
                        }
                    )
                    
                    logger.info(f"Uploaded {len(records_to_archive)} records to s3://"
                               f"{settings.s3_bucket_name}/{s3_key}")
                    
                    # Record archive metadata
                    metadata_record = {
                        'archive_key': s3_key,
                        'archive_date': date.isoformat(),
                        'platform': platform,
                        'records_count': len(records_to_archive),
                        'compressed_size_bytes': compressed_size,
                        'uncompressed_size_bytes': uncompressed_size,
                        'compression_ratio': round((1 - compressed_size / uncompressed_size) * 100, 2),
                        'data_from_date': min(r['created_at'] for r in records_to_archive),
                        'data_to_date': max(r['created_at'] for r in records_to_archive),
                        's3_bucket': settings.s3_bucket_name,
                        'archive_status': 'completed',
                    }
                    
                    self.supabase.table('archive_metadata').insert(metadata_record).execute()
                    
                    # Mark records as archived
                    record_ids = [r['id'] for r in records_to_archive]
                    self.supabase.table('training_data').update({
                        'archived_at': datetime.utcnow().isoformat()
                    }).in_('id', record_ids).execute()
                    
                    archived_stats.append({
                        'platform': platform,
                        'date': str(date),
                        'records_count': len(records_to_archive),
                        'uncompressed_size': uncompressed_size,
                        'compressed_size': compressed_size,
                        'compression_ratio': metadata_record['compression_ratio'],
                        's3_key': s3_key,
                    })
                    
                    total_archived += len(records_to_archive)
                    
                except ClientError as e:
                    logger.error(f"Failed to upload archive to S3: {e}")
                    
                    # Record failed archive
                    metadata_record = {
                        'archive_key': s3_key,
                        'archive_date': date.isoformat(),
                        'platform': platform,
                        'records_count': len(records_to_archive),
                        'archive_status': 'failed',
                        'error_message': str(e),
                    }
                    self.supabase.table('archive_metadata').insert(metadata_record).execute()
            
            logger.info(f"Archiving complete: {total_archived} records archived")
            
            return {
                'success': True,
                'archived_count': total_archived,
                'archives': archived_stats,
                'cutoff_date': cutoff_date.isoformat(),
            }
            
        except Exception as e:
            logger.error(f"Failed to archive data: {e}", exc_info=True)
            return {
                'success': False,
                'error': str(e),
                'archived_count': 0,
            }
    
    async def get_training_dataset(
        self,
        platform: Optional[str] = None,
        success_only: bool = True,
        with_feedback_only: bool = False,
        include_archived: bool = False,
        limit: Optional[int] = None,
    ) -> List[Dict]:
        """
        Fetch training dataset with filters.
        
        Args:
            platform: Filter by platform (None for all)
            success_only: Only include successful interactions
            with_feedback_only: Only include interactions with user feedback
            include_archived: Include archived data
            limit: Maximum number of records to return
            
        Returns:
            List of training data records
        """
        try:
            query = self.supabase.table('training_data').select('*')
            
            # Apply filters
            if platform:
                query = query.eq('platform', platform)
            
            if success_only:
                query = query.eq('success', True)
            
            if with_feedback_only:
                query = query.neq('user_feedback', 'none')
            
            if not include_archived:
                query = query.is_('archived_at', 'null')
            
            if limit:
                query = query.limit(limit)
            
            # Order by creation date
            query = query.order('created_at', desc=True)
            
            result = query.execute()
            
            records = result.data
            
            # Decompress workflows if needed
            for record in records:
                if record.get('is_compressed') and record.get('workflow_compressed'):
                    try:
                        record['workflow_generated'] = self._decompress_data(
                            record['workflow_compressed']
                        )
                    except Exception as e:
                        logger.error(f"Failed to decompress record {record['id']}: {e}")
            
            logger.info(f"Fetched {len(records)} training records "
                       f"(platform: {platform or 'all'}, success_only: {success_only})")
            
            return records
            
        except Exception as e:
            logger.error(f"Failed to fetch training dataset: {e}", exc_info=True)
            return []
    
    async def export_training_data(
        self,
        platform: str,
        output_format: str = 'openai',
        success_only: bool = True,
        with_feedback_only: bool = False,
    ) -> Optional[str]:
        """
        Export training data in specified format.
        
        Args:
            platform: Platform to export data for
            output_format: Export format ('openai' for OpenAI fine-tuning format)
            success_only: Only include successful interactions
            with_feedback_only: Only include interactions with feedback
            
        Returns:
            JSONL string ready for download, or None if failed
        """
        try:
            # Fetch data
            records = await self.get_training_dataset(
                platform=platform,
                success_only=success_only,
                with_feedback_only=with_feedback_only,
                include_archived=False,
            )
            
            if not records:
                logger.warning(f"No data to export for platform {platform}")
                return None
            
            if output_format == 'openai':
                # Convert to OpenAI fine-tuning format
                training_examples = []
                
                for record in records:
                    # Get workflow (decompress if needed)
                    workflow = record.get('workflow_generated')
                    if not workflow:
                        continue
                    
                    # Format as OpenAI messages
                    example = {
                        'messages': [
                            {
                                'role': 'system',
                                'content': f"You are an expert {platform} workflow generator. "
                                          f"Generate valid workflow JSON based on user requirements."
                            },
                            {
                                'role': 'user',
                                'content': record['user_message']
                            },
                            {
                                'role': 'assistant',
                                'content': json.dumps(workflow, separators=(',', ':'))
                            }
                        ]
                    }
                    
                    # Add metadata as comments (for reference, not used in training)
                    if record.get('user_feedback') and record['user_feedback'] != 'none':
                        example['metadata'] = {
                            'feedback': record['user_feedback'],
                            'interaction_id': record['interaction_id'],
                        }
                    
                    training_examples.append(example)
                
                # Convert to JSONL
                jsonl_lines = [json.dumps(example) for example in training_examples]
                jsonl_content = '\n'.join(jsonl_lines)
                
                logger.info(f"Exported {len(training_examples)} examples for {platform} "
                           f"in OpenAI format")
                
                return jsonl_content
            
            else:
                logger.error(f"Unsupported export format: {output_format}")
                return None
                
        except Exception as e:
            logger.error(f"Failed to export training data: {e}", exc_info=True)
            return None
    
    async def get_storage_stats(self) -> Dict[str, Any]:
        """
        Get comprehensive storage statistics and cost estimates.
        
        Returns:
            Dictionary with detailed storage statistics
        """
        try:
            # Get stats from database function
            result = self.supabase.rpc('get_storage_stats').execute()
            
            # Convert to dictionary
            stats_dict = {}
            if result.data:
                for row in result.data:
                    metric = row['metric']
                    stats_dict[metric] = {
                        'value': row['value_numeric'],
                        'display': row['value_text'],
                    }
            
            # Get platform breakdown
            platform_result = self.supabase.table('training_data_summary').select('*').execute()
            
            platform_stats = {}
            if platform_result.data:
                for row in platform_result.data:
                    platform_stats[row['platform']] = row
            
            # Get training readiness
            readiness_result = self.supabase.table('training_readiness_view').select('*').execute()
            
            readiness_stats = {}
            if readiness_result.data:
                for row in readiness_result.data:
                    readiness_stats[row['platform']] = row
            
            # Calculate cost estimates (rough estimates)
            supabase_size_bytes = stats_dict.get('supabase_size_bytes', {}).get('value', 0)
            archived_size_bytes = stats_dict.get('archived_size_bytes', {}).get('value', 0)
            
            # Supabase: ~$0.125 per GB-month
            # R2: ~$0.015 per GB-month (much cheaper!)
            supabase_cost_monthly = (supabase_size_bytes / (1024**3)) * 0.125
            r2_cost_monthly = (archived_size_bytes / (1024**3)) * 0.015
            total_cost_monthly = supabase_cost_monthly + r2_cost_monthly
            
            # Calculate savings
            if archived_size_bytes > 0:
                cost_without_archiving = ((supabase_size_bytes + archived_size_bytes) / (1024**3)) * 0.125
                savings_monthly = cost_without_archiving - total_cost_monthly
                savings_percentage = (savings_monthly / cost_without_archiving) * 100
            else:
                cost_without_archiving = supabase_cost_monthly
                savings_monthly = 0
                savings_percentage = 0
            
            return {
                'overview': {
                    'total_records': stats_dict.get('total_training_records', {}).get('value', 0),
                    'active_records': stats_dict.get('active_records', {}).get('value', 0),
                    'archived_records': stats_dict.get('archived_records', {}).get('value', 0),
                    'compressed_records': stats_dict.get('compressed_records', {}).get('value', 0),
                    'records_with_feedback': stats_dict.get('records_with_feedback', {}).get('value', 0),
                },
                'storage': {
                    'supabase_size_bytes': supabase_size_bytes,
                    'supabase_size_display': stats_dict.get('supabase_size_bytes', {}).get('display', '0 bytes'),
                    'archived_size_bytes': archived_size_bytes,
                    'archived_size_display': stats_dict.get('archived_size_bytes', {}).get('display', '0 bytes'),
                    'total_size_bytes': supabase_size_bytes + archived_size_bytes,
                    'total_size_display': self._format_bytes(supabase_size_bytes + archived_size_bytes),
                },
                'costs': {
                    'supabase_monthly_usd': round(supabase_cost_monthly, 2),
                    'r2_monthly_usd': round(r2_cost_monthly, 2),
                    'total_monthly_usd': round(total_cost_monthly, 2),
                    'cost_without_archiving_usd': round(cost_without_archiving, 2),
                    'savings_monthly_usd': round(savings_monthly, 2),
                    'savings_percentage': round(savings_percentage, 1),
                },
                'by_platform': platform_stats,
                'training_readiness': readiness_stats,
                'recommendations': self._generate_recommendations(
                    stats_dict,
                    readiness_stats,
                    supabase_size_bytes,
                    archived_size_bytes,
                ),
            }
            
        except Exception as e:
            logger.error(f"Failed to get storage stats: {e}", exc_info=True)
            return {
                'error': str(e),
                'overview': {},
                'storage': {},
                'costs': {},
                'by_platform': {},
                'training_readiness': {},
                'recommendations': [],
            }
    
    def _format_bytes(self, bytes_value: int) -> str:
        """Format bytes as human-readable string."""
        for unit in ['bytes', 'KB', 'MB', 'GB', 'TB']:
            if bytes_value < 1024.0:
                return f"{bytes_value:.2f} {unit}"
            bytes_value /= 1024.0
        return f"{bytes_value:.2f} PB"
    
    def _generate_recommendations(
        self,
        stats: Dict,
        readiness: Dict,
        supabase_size: int,
        archived_size: int,
    ) -> List[str]:
        """Generate recommendations based on current stats."""
        recommendations = []
        
        # Storage recommendations
        if supabase_size > 1024**3:  # > 1GB
            if not archived_size or archived_size < supabase_size * 0.5:
                recommendations.append(
                    "⚠️ Large amount of data in Supabase. Consider enabling archiving "
                    "to reduce costs by up to 90%."
                )
        
        # Feedback recommendations
        records_with_feedback = stats.get('records_with_feedback', {}).get('value', 0)
        total_records = stats.get('active_records', {}).get('value', 1)
        feedback_rate = (records_with_feedback / total_records * 100) if total_records > 0 else 0
        
        if feedback_rate < 10:
            recommendations.append(
                "💡 Low feedback rate. Encourage users to rate workflows for better training data."
            )
        
        # Training readiness recommendations
        for platform, data in readiness.items():
            if data.get('readiness_score', 0) < 70:
                recommendations.append(
                    f"📊 {platform}: {data.get('recommendation', 'Continue collecting data')}"
                )
            elif data.get('readiness_score', 0) >= 70:
                recommendations.append(
                    f"✅ {platform}: Ready for training with {data.get('total_examples', 0)} examples"
                )
        
        # Archiving recommendations
        if self.s3_client and supabase_size > 100 * 1024**2:  # > 100MB
            recommendations.append(
                "💰 Archiving can save significant costs. "
                f"Potential savings: ~{round((supabase_size / (1024**3)) * 0.11, 2)} USD/month"
            )
        
        if not recommendations:
            recommendations.append("✨ Everything looks good! Continue collecting quality data.")
        
        return recommendations

