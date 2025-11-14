"""
Data Labeling Service for Quality Control

This service provides functionality for reviewing, labeling, and curating training data.
It implements smart queuing, auto-labeling, and quality metrics calculation.
"""

import logging
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
import json

from supabase import Client

logger = logging.getLogger(__name__)


class LabelingService:
    """
    Service for labeling and quality control of training data.
    
    Provides methods for:
    - Smart labeling queue management
    - Quality scoring and labeling
    - Auto-labeling high-confidence examples
    - Duplicate detection
    - Quality metrics calculation
    """
    
    def __init__(self, supabase_client: Client):
        """
        Initialize the LabelingService.
        
        Args:
            supabase_client: Supabase client for database operations
        """
        self.supabase = supabase_client
    
    async def get_labeling_queue(
        self,
        platform: Optional[str] = None,
        has_feedback: Optional[bool] = None,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> Tuple[List[Dict], int]:
        """
        Get smart labeling queue with prioritization.
        
        Priority order:
        1. User corrections (most valuable)
        2. Thumbs down (learn from failures)
        3. Has any feedback
        4. Validation failures
        5. Recent data
        
        Args:
            platform: Filter by platform
            has_feedback: Filter by feedback presence
            date_from: Filter by creation date (start)
            date_to: Filter by creation date (end)
            limit: Number of results
            offset: Pagination offset
            
        Returns:
            Tuple of (interactions list, total count)
        """
        try:
            # Build query from view
            query = self.supabase.table('labeling_queue_view').select('*', count='exact')
            
            # Apply filters
            if platform:
                query = query.eq('platform', platform)
            
            if has_feedback is not None:
                if has_feedback:
                    query = query.not_.eq('user_feedback', 'none').not_.is_('user_feedback', 'null')
                else:
                    query = query.or_('user_feedback.eq.none,user_feedback.is.null')
            
            if date_from:
                query = query.gte('created_at', date_from)
            
            if date_to:
                query = query.lte('created_at', date_to)
            
            # Apply pagination
            query = query.range(offset, offset + limit - 1)
            
            # Execute query
            result = query.execute()
            
            total_count = result.count if hasattr(result, 'count') else len(result.data)
            
            logger.info(f"Retrieved {len(result.data)} items from labeling queue (total: {total_count})")
            
            return result.data, total_count
            
        except Exception as e:
            logger.error(f"Failed to get labeling queue: {e}", exc_info=True)
            return [], 0
    
    async def label_interaction(
        self,
        interaction_id: str,
        labeled_by: str,
        quality_score: int,
        review_notes: Optional[str] = None,
        tags: Optional[List[str]] = None,
        is_curated: bool = False,
    ) -> bool:
        """
        Label an interaction with quality score and metadata.
        
        Args:
            interaction_id: Interaction ID to label
            labeled_by: User ID of the reviewer
            quality_score: Quality score 0-100
            review_notes: Optional reviewer notes
            tags: Optional descriptive tags
            is_curated: Mark as curated high-quality example
            
        Returns:
            True if successful, False otherwise
        """
        if not (0 <= quality_score <= 100):
            logger.error(f"Invalid quality score: {quality_score}")
            return False
        
        try:
            update_data = {
                'quality_score': quality_score,
                'is_labeled': True,
                'labeled_by': labeled_by,
                'labeled_at': datetime.utcnow().isoformat(),
                'review_notes': review_notes,
                'tags': tags or [],
                'is_curated': is_curated,
                'auto_labeled': False,
            }
            
            result = self.supabase.table('training_data').update(update_data).eq(
                'interaction_id', interaction_id
            ).execute()
            
            if result.data:
                logger.info(f"Labeled interaction {interaction_id} with quality score {quality_score}")
                return True
            else:
                logger.warning(f"No interaction found with ID {interaction_id}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to label interaction: {e}", exc_info=True)
            return False
    
    async def batch_label(
        self,
        interaction_ids: List[str],
        labeled_by: str,
        quality_score: int,
        review_notes: Optional[str] = None,
        tags: Optional[List[str]] = None,
    ) -> Dict[str, int]:
        """
        Label multiple interactions at once with the same quality score.
        
        Args:
            interaction_ids: List of interaction IDs to label
            labeled_by: User ID of the reviewer
            quality_score: Quality score to assign
            review_notes: Optional notes
            tags: Optional tags
            
        Returns:
            Dict with success and failed counts
        """
        results = {'success': 0, 'failed': 0}
        
        for interaction_id in interaction_ids:
            success = await self.label_interaction(
                interaction_id,
                labeled_by,
                quality_score,
                review_notes,
                tags,
            )
            if success:
                results['success'] += 1
            else:
                results['failed'] += 1
        
        logger.info(f"Batch labeled {results['success']} interactions, {results['failed']} failed")
        return results
    
    async def reject_interaction(
        self,
        interaction_id: str,
        labeled_by: str,
        rejection_reason: str,
    ) -> bool:
        """
        Mark an interaction as rejected (do not use for training).
        
        Args:
            interaction_id: Interaction ID to reject
            labeled_by: User ID of the reviewer
            rejection_reason: Reason for rejection
            
        Returns:
            True if successful
        """
        try:
            update_data = {
                'is_rejected': True,
                'rejection_reason': rejection_reason,
                'is_labeled': True,
                'labeled_by': labeled_by,
                'labeled_at': datetime.utcnow().isoformat(),
                'quality_score': 0,
            }
            
            result = self.supabase.table('training_data').update(update_data).eq(
                'interaction_id', interaction_id
            ).execute()
            
            if result.data:
                logger.info(f"Rejected interaction {interaction_id}: {rejection_reason}")
                return True
            return False
            
        except Exception as e:
            logger.error(f"Failed to reject interaction: {e}", exc_info=True)
            return False
    
    async def curate_example(
        self,
        interaction_id: str,
        labeled_by: str,
        category: Optional[str] = None,
    ) -> Optional[str]:
        """
        Add interaction to curated examples (workflow_examples table).
        
        Args:
            interaction_id: Interaction ID to curate
            labeled_by: User ID of the curator
            category: Optional category
            
        Returns:
            Curated example ID if successful, None otherwise
        """
        try:
            # Get training data
            result = self.supabase.table('training_data').select('*').eq(
                'interaction_id', interaction_id
            ).execute()
            
            if not result.data:
                logger.warning(f"No interaction found with ID {interaction_id}")
                return None
            
            data = result.data[0]
            
            # Get workflow JSON (decompress if needed)
            workflow_json = data.get('workflow_generated')
            if not workflow_json and data.get('workflow_compressed'):
                # Would need decompression here - using data_collector
                from app.services.data_collector import DataCollector
                dc = DataCollector(self.supabase)
                workflow_json = dc._decompress_data(data['workflow_compressed'])
            
            if not workflow_json:
                logger.warning(f"No workflow data for interaction {interaction_id}")
                return None
            
            # Create curated example
            curated_data = {
                'source_interaction_id': interaction_id,
                'user_intent': data['user_message'],
                'workflow_json': workflow_json,
                'platform': data['platform'],
                'quality_score': data.get('quality_score', 90),
                'is_verified': True,
                'verified_by': labeled_by,
                'verified_at': datetime.utcnow().isoformat(),
                'category': category,
                'tags': data.get('tags', []),
            }
            
            result = self.supabase.table('workflow_examples').insert(curated_data).execute()
            
            if result.data:
                # Mark original as curated
                self.supabase.table('training_data').update({
                    'is_curated': True,
                    'quality_score': max(data.get('quality_score', 0), 90),
                }).eq('interaction_id', interaction_id).execute()
                
                example_id = result.data[0]['id']
                logger.info(f"Curated example {example_id} from interaction {interaction_id}")
                return example_id
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to curate example: {e}", exc_info=True)
            return None
    
    async def auto_label_high_confidence(self, batch_size: int = 100) -> Dict[str, int]:
        """
        Automatically label high-confidence interactions.
        
        Criteria:
        - Thumbs up + validation passed = quality_score 80
        - Validation passed + no errors = quality_score 70
        - User corrections = quality_score 90
        - Thumbs down = quality_score 30 (flag for review)
        
        Args:
            batch_size: Number of interactions to process
            
        Returns:
            Dict with counts of labeled interactions
        """
        results = {
            'thumbs_up': 0,
            'validated': 0,
            'corrections': 0,
            'thumbs_down': 0,
            'total': 0,
        }
        
        try:
            # Get unlabeled interactions
            result = self.supabase.table('training_data').select('*').eq(
                'is_labeled', False
            ).eq('is_rejected', False).is_('archived_at', 'null').limit(batch_size).execute()
            
            for interaction in result.data:
                interaction_id = interaction['interaction_id']
                quality_score = None
                auto_label_type = None
                
                # Check for user corrections (highest quality)
                validation_result = self.supabase.table('validation_logs').select('*').eq(
                    'training_data_id', interaction['id']
                ).eq('user_edited', True).execute()
                
                if validation_result.data:
                    quality_score = 90
                    auto_label_type = 'corrections'
                    results['corrections'] += 1
                
                # Thumbs up (high quality)
                elif interaction.get('user_feedback') == 'thumbs_up':
                    quality_score = 80
                    auto_label_type = 'thumbs_up'
                    results['thumbs_up'] += 1
                
                # Thumbs down (low quality, flag for review)
                elif interaction.get('user_feedback') == 'thumbs_down':
                    quality_score = 30
                    auto_label_type = 'thumbs_down'
                    results['thumbs_down'] += 1
                
                # Validation passed (decent quality)
                elif interaction.get('success'):
                    validation_result = self.supabase.table('validation_logs').select('*').eq(
                        'training_data_id', interaction['id']
                    ).eq('validation_passed', True).execute()
                    
                    if validation_result.data:
                        quality_score = 70
                        auto_label_type = 'validated'
                        results['validated'] += 1
                
                # Apply auto-label if score determined
                if quality_score:
                    self.supabase.table('training_data').update({
                        'quality_score': quality_score,
                        'is_labeled': True,
                        'auto_labeled': True,
                        'labeled_at': datetime.utcnow().isoformat(),
                        'review_notes': f'Auto-labeled: {auto_label_type}',
                    }).eq('interaction_id', interaction_id).execute()
                    
                    results['total'] += 1
            
            logger.info(f"Auto-labeled {results['total']} interactions")
            return results
            
        except Exception as e:
            logger.error(f"Failed to auto-label: {e}", exc_info=True)
            return results
    
    async def detect_duplicates(self) -> List[Dict]:
        """
        Find and flag duplicate workflows.
        
        Returns:
            List of duplicate pairs
        """
        try:
            result = self.supabase.rpc('find_duplicate_workflows').execute()
            
            duplicates = result.data or []
            
            # Flag duplicates in database
            for dup in duplicates:
                self.supabase.table('training_data').update({
                    'is_duplicate': True,
                    'duplicate_of': dup['original_id'],
                }).eq('id', dup['duplicate_id']).execute()
            
            logger.info(f"Detected {len(duplicates)} duplicate workflows")
            return duplicates
            
        except Exception as e:
            logger.error(f"Failed to detect duplicates: {e}", exc_info=True)
            return []
    
    async def validate_training_example(self, interaction_id: str) -> Dict[str, Any]:
        """
        Validate that a training example is suitable for training.
        
        Checks:
        - Workflow JSON is valid
        - Has required fields
        - Not rejected
        - Not duplicate
        - Quality score above threshold
        
        Args:
            interaction_id: Interaction ID to validate
            
        Returns:
            Dict with validation result and details
        """
        try:
            result = self.supabase.table('training_data').select('*').eq(
                'interaction_id', interaction_id
            ).execute()
            
            if not result.data:
                return {'valid': False, 'reason': 'Interaction not found'}
            
            data = result.data[0]
            
            # Check rejection
            if data.get('is_rejected'):
                return {'valid': False, 'reason': 'Interaction is rejected'}
            
            # Check duplicate
            if data.get('is_duplicate'):
                return {'valid': False, 'reason': 'Interaction is a duplicate'}
            
            # Check workflow exists
            if not data.get('workflow_generated') and not data.get('workflow_compressed'):
                return {'valid': False, 'reason': 'No workflow data'}
            
            # Check JSON validity
            try:
                workflow = data.get('workflow_generated')
                if workflow:
                    json.dumps(workflow)  # Validate serializable
                else:
                    # Would decompress and validate
                    pass
            except Exception:
                return {'valid': False, 'reason': 'Invalid workflow JSON'}
            
            # Check quality score
            quality_score = data.get('quality_score')
            if quality_score is not None and quality_score < 50:
                return {'valid': False, 'reason': f'Quality score too low: {quality_score}'}
            
            return {
                'valid': True,
                'quality_score': quality_score,
                'is_curated': data.get('is_curated', False),
                'has_feedback': data.get('user_feedback') not in [None, 'none'],
            }
            
        except Exception as e:
            logger.error(f"Failed to validate training example: {e}", exc_info=True)
            return {'valid': False, 'reason': str(e)}
    
    async def get_labeling_stats(
        self,
        platform: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Get labeling statistics and progress.
        
        Args:
            platform: Optional platform filter
            
        Returns:
            Dict with labeling statistics
        """
        try:
            query = self.supabase.table('labeling_stats_view').select('*')
            
            if platform:
                query = query.eq('platform', platform)
            
            result = query.execute()
            
            stats = {
                'by_platform': {},
                'overall': {
                    'total_interactions': 0,
                    'labeled_count': 0,
                    'unlabeled_count': 0,
                    'rejected_count': 0,
                    'curated_count': 0,
                    'auto_labeled_count': 0,
                    'manual_labeled_count': 0,
                    'avg_quality_score': 0,
                }
            }
            
            for row in result.data:
                platform_name = row['platform']
                stats['by_platform'][platform_name] = row
                
                # Aggregate overall stats
                stats['overall']['total_interactions'] += row['total_interactions']
                stats['overall']['labeled_count'] += row['labeled_count']
                stats['overall']['unlabeled_count'] += row['unlabeled_count']
                stats['overall']['rejected_count'] += row['rejected_count']
                stats['overall']['curated_count'] += row['curated_count']
                stats['overall']['auto_labeled_count'] += row['auto_labeled_count']
                stats['overall']['manual_labeled_count'] += row['manual_labeled_count']
            
            # Calculate overall average quality
            if stats['overall']['labeled_count'] > 0:
                total_quality = sum(
                    (row['avg_quality_score'] or 0) * row['labeled_count']
                    for row in result.data
                )
                stats['overall']['avg_quality_score'] = (
                    total_quality / stats['overall']['labeled_count']
                )
            
            logger.info(f"Retrieved labeling stats for {len(result.data)} platforms")
            return stats
            
        except Exception as e:
            logger.error(f"Failed to get labeling stats: {e}", exc_info=True)
            return {'by_platform': {}, 'overall': {}}
    
    async def calculate_quality_score(
        self,
        has_feedback: bool,
        feedback_type: Optional[str],
        validation_passed: bool,
        has_errors: bool,
        user_edited: bool,
        workflow_complexity: Optional[int] = None,
    ) -> int:
        """
        Calculate quality score based on available signals.
        
        Args:
            has_feedback: Whether interaction has user feedback
            feedback_type: Type of feedback (thumbs_up, thumbs_down, etc.)
            validation_passed: Whether validation passed
            has_errors: Whether validation had errors
            user_edited: Whether user edited the workflow
            workflow_complexity: Optional complexity metric
            
        Returns:
            Quality score 0-100
        """
        score = 50  # Neutral baseline
        
        # User corrections = highest quality
        if user_edited:
            score = 90
        # Thumbs up = high quality
        elif feedback_type == 'thumbs_up':
            score = 80
        # Thumbs down = low quality
        elif feedback_type == 'thumbs_down':
            score = 30
        # Validation passed with no errors = decent
        elif validation_passed and not has_errors:
            score = 70
        # Validation failed = poor
        elif not validation_passed:
            score = 40
        
        # Adjust based on complexity (if provided)
        if workflow_complexity:
            if workflow_complexity > 10:  # Complex workflows
                score = min(100, score + 5)
            elif workflow_complexity < 3:  # Too simple
                score = max(0, score - 5)
        
        return score

