"""
Standalone script for archiving old training data to S3/R2 storage.

This script can be run manually or scheduled via cron to automatically
archive training data older than the specified threshold.

Usage:
    python -m app.tasks.archive_training_data [--days-old DAYS] [--dry-run]

Examples:
    # Archive data older than 30 days (default)
    python -m app.tasks.archive_training_data
    
    # Archive data older than 60 days
    python -m app.tasks.archive_training_data --days-old 60
    
    # Preview what would be archived without actually archiving
    python -m app.tasks.archive_training_data --dry-run
    
    # Set up as cron job (run daily at 2 AM)
    0 2 * * * cd /path/to/app && python -m app.tasks.archive_training_data
"""

import asyncio
import argparse
import logging
import sys
from datetime import datetime, timedelta
from typing import Dict, Any

# Setup path for imports
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from app.services.data_collector import DataCollector
from app.services.supabase_client import get_supabase_client
from app.core.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('archive_training_data.log')
    ]
)
logger = logging.getLogger(__name__)


def format_bytes(bytes_value: int) -> str:
    """Format bytes as human-readable string."""
    for unit in ['bytes', 'KB', 'MB', 'GB', 'TB']:
        if bytes_value < 1024.0:
            return f"{bytes_value:.2f} {unit}"
        bytes_value /= 1024.0
    return f"{bytes_value:.2f} PB"


def print_banner():
    """Print script banner."""
    print("=" * 80)
    print("  Training Data Archiving Tool")
    print("  WorkflowBridge Data Collection System")
    print("=" * 80)
    print()


def print_stats_table(title: str, stats: Dict[str, Any]):
    """Print a formatted statistics table."""
    print(f"\n{title}")
    print("-" * 60)
    for key, value in stats.items():
        if isinstance(value, dict):
            print(f"  {key}:")
            for sub_key, sub_value in value.items():
                print(f"    {sub_key}: {sub_value}")
        else:
            print(f"  {key}: {value}")
    print("-" * 60)


async def get_archivable_stats(days_old: int) -> Dict[str, Any]:
    """
    Get statistics about data that can be archived.
    
    Args:
        days_old: Age threshold in days
        
    Returns:
        Dictionary with statistics
    """
    try:
        supabase_client = get_supabase_client()
        cutoff_date = datetime.utcnow() - timedelta(days=days_old)
        
        # Get count of records to archive
        result = supabase_client.table('training_data').select(
            'platform,size_bytes', count='exact'
        ).lt('created_at', cutoff_date.isoformat()).is_('archived_at', 'null').execute()
        
        total_count = len(result.data) if result.data else 0
        total_size = sum(r.get('size_bytes', 0) for r in result.data) if result.data else 0
        
        # Group by platform
        by_platform = {}
        if result.data:
            for record in result.data:
                platform = record.get('platform', 'unknown')
                if platform not in by_platform:
                    by_platform[platform] = {'count': 0, 'size': 0}
                by_platform[platform]['count'] += 1
                by_platform[platform]['size'] += record.get('size_bytes', 0)
        
        return {
            'total_records': total_count,
            'total_size_bytes': total_size,
            'total_size_display': format_bytes(total_size),
            'by_platform': by_platform,
            'cutoff_date': cutoff_date.isoformat(),
        }
        
    except Exception as e:
        logger.error(f"Failed to get archivable stats: {e}")
        return {
            'total_records': 0,
            'total_size_bytes': 0,
            'error': str(e)
        }


async def run_archiving(days_old: int, dry_run: bool = False) -> Dict[str, Any]:
    """
    Run the archiving process.
    
    Args:
        days_old: Archive data older than this many days
        dry_run: If True, only preview what would be archived
        
    Returns:
        Dictionary with archiving results
    """
    logger.info(f"Starting archiving process (days_old: {days_old}, dry_run: {dry_run})")
    
    # Check configuration
    if not dry_run and not settings.archiving_enabled:
        logger.error("Archiving is not enabled or S3 is not configured")
        return {
            'success': False,
            'error': 'Archiving not configured. Set S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, '
                    'and ENABLE_DATA_ARCHIVING=true',
            'archived_count': 0,
        }
    
    try:
        # Get stats before archiving
        print("\n📊 Analyzing data to archive...")
        before_stats = await get_archivable_stats(days_old)
        
        print_stats_table("Data Eligible for Archiving", {
            'Total Records': before_stats['total_records'],
            'Total Size': before_stats['total_size_display'],
            'Cutoff Date': before_stats['cutoff_date'],
            'By Platform': before_stats.get('by_platform', {}),
        })
        
        if before_stats['total_records'] == 0:
            print("\n✅ No data to archive!")
            return {
                'success': True,
                'archived_count': 0,
                'message': 'No data to archive',
            }
        
        if dry_run:
            print(f"\n🔍 DRY RUN: Would archive {before_stats['total_records']} records "
                  f"({before_stats['total_size_display']})")
            print("Run without --dry-run to actually archive this data.")
            return {
                'success': True,
                'archived_count': before_stats['total_records'],
                'dry_run': True,
            }
        
        # Initialize data collector
        print("\n📦 Initializing archiving service...")
        supabase_client = get_supabase_client()
        data_collector = DataCollector(supabase_client)
        
        # Perform archiving
        print(f"\n🚀 Archiving data older than {days_old} days to S3/R2...")
        print("This may take a few minutes depending on data volume...")
        
        result = await data_collector.archive_old_data(days_old=days_old)
        
        if result.get('success'):
            print(f"\n✅ Successfully archived {result['archived_count']} records!")
            
            # Show detailed archive info
            if result.get('archives'):
                print_stats_table("Archives Created", {
                    f"Archive {i+1}": {
                        'Platform': archive['platform'],
                        'Date': archive['date'],
                        'Records': archive['records_count'],
                        'Original Size': format_bytes(archive['uncompressed_size']),
                        'Compressed Size': format_bytes(archive['compressed_size']),
                        'Compression Ratio': f"{archive['compression_ratio']}%",
                        'S3 Key': archive['s3_key'],
                    }
                    for i, archive in enumerate(result['archives'])
                })
            
            # Calculate savings
            if before_stats['total_size_bytes'] > 0:
                # Supabase costs ~$0.125/GB/month, R2 costs ~$0.015/GB/month
                before_cost_monthly = (before_stats['total_size_bytes'] / (1024**3)) * 0.125
                after_cost_monthly = (before_stats['total_size_bytes'] / (1024**3)) * 0.015
                savings_monthly = before_cost_monthly - after_cost_monthly
                savings_yearly = savings_monthly * 12
                
                print(f"\n💰 Cost Savings Estimate:")
                print(f"  Before (Supabase): ${before_cost_monthly:.2f}/month")
                print(f"  After (R2):        ${after_cost_monthly:.2f}/month")
                print(f"  Monthly Savings:   ${savings_monthly:.2f} (~{(savings_monthly/before_cost_monthly)*100:.0f}% reduction)")
                print(f"  Yearly Savings:    ${savings_yearly:.2f}")
            
        else:
            print(f"\n❌ Archiving failed: {result.get('error', 'Unknown error')}")
        
        return result
        
    except Exception as e:
        logger.error(f"Archiving process failed: {e}", exc_info=True)
        return {
            'success': False,
            'error': str(e),
            'archived_count': 0,
        }


async def show_current_storage_stats():
    """Display current storage statistics."""
    try:
        print("\n📈 Current Storage Statistics")
        print("=" * 60)
        
        supabase_client = get_supabase_client()
        data_collector = DataCollector(supabase_client)
        
        stats = await data_collector.get_storage_stats()
        
        # Overview
        overview = stats.get('overview', {})
        print(f"\n📊 Overview:")
        print(f"  Total Records:     {overview.get('total_records', 0):,}")
        print(f"  Active Records:    {overview.get('active_records', 0):,}")
        print(f"  Archived Records:  {overview.get('archived_records', 0):,}")
        print(f"  With Feedback:     {overview.get('records_with_feedback', 0):,}")
        
        # Storage
        storage = stats.get('storage', {})
        print(f"\n💾 Storage:")
        print(f"  Supabase Size:     {storage.get('supabase_size_display', '0 bytes')}")
        print(f"  Archived Size:     {storage.get('archived_size_display', '0 bytes')}")
        print(f"  Total Size:        {storage.get('total_size_display', '0 bytes')}")
        
        # Costs
        costs = stats.get('costs', {})
        print(f"\n💰 Cost Estimates:")
        print(f"  Supabase:          ${costs.get('supabase_monthly_usd', 0):.2f}/month")
        print(f"  R2 Storage:        ${costs.get('r2_monthly_usd', 0):.2f}/month")
        print(f"  Total:             ${costs.get('total_monthly_usd', 0):.2f}/month")
        if costs.get('savings_monthly_usd', 0) > 0:
            print(f"  Savings:           ${costs.get('savings_monthly_usd', 0):.2f}/month ({costs.get('savings_percentage', 0):.1f}%)")
        
        # Platform breakdown
        by_platform = stats.get('by_platform', {})
        if by_platform:
            print(f"\n🔧 By Platform:")
            for platform, data in by_platform.items():
                print(f"  {platform.upper()}:")
                print(f"    Total: {data.get('total_interactions', 0):,} | "
                      f"Success Rate: {data.get('success_rate', 0):.1f}% | "
                      f"With Feedback: {data.get('total_feedback_count', 0):,}")
        
        # Recommendations
        recommendations = stats.get('recommendations', [])
        if recommendations:
            print(f"\n💡 Recommendations:")
            for i, rec in enumerate(recommendations, 1):
                print(f"  {i}. {rec}")
        
        print("=" * 60)
        
    except Exception as e:
        logger.error(f"Failed to get storage stats: {e}")
        print(f"\n❌ Failed to retrieve storage statistics: {e}")


def main():
    """Main entry point for the script."""
    parser = argparse.ArgumentParser(
        description="Archive old training data to S3/R2 storage",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )
    
    parser.add_argument(
        '--days-old',
        type=int,
        default=30,
        help='Archive data older than this many days (default: 30)'
    )
    
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Preview what would be archived without actually archiving'
    )
    
    parser.add_argument(
        '--stats-only',
        action='store_true',
        help='Only show current storage statistics without archiving'
    )
    
    parser.add_argument(
        '--verbose',
        action='store_true',
        help='Enable verbose logging'
    )
    
    args = parser.parse_args()
    
    # Set log level
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Print banner
    print_banner()
    
    # Run the appropriate operation
    try:
        if args.stats_only:
            asyncio.run(show_current_storage_stats())
        else:
            result = asyncio.run(run_archiving(
                days_old=args.days_old,
                dry_run=args.dry_run
            ))
            
            # Show final stats
            asyncio.run(show_current_storage_stats())
            
            # Exit with appropriate code
            sys.exit(0 if result.get('success', False) else 1)
            
    except KeyboardInterrupt:
        print("\n\n⚠️  Archiving interrupted by user")
        sys.exit(130)
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        print(f"\n❌ Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()

