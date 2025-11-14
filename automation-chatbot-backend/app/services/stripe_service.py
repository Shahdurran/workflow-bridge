"""
Stripe integration for subscription management.
"""
import stripe
from app.core.config import get_settings
from typing import Optional
import logging

logger = logging.getLogger(__name__)
settings = get_settings()
stripe.api_key = settings.stripe_secret_key

class StripeService:
    """Handle Stripe subscription operations."""
    
    @staticmethod
    async def create_checkout_session(
        user_id: str,
        user_email: str,
        price_id: str,
        success_url: str,
        cancel_url: str
    ) -> dict:
        """Create a Stripe Checkout session for subscription."""
        try:
            session = stripe.checkout.Session.create(
                customer_email=user_email,
                client_reference_id=user_id,
                line_items=[{
                    'price': price_id,
                    'quantity': 1,
                }],
                mode='subscription',
                success_url=success_url,
                cancel_url=cancel_url,
                metadata={
                    'user_id': user_id
                }
            )
            
            return {
                'checkout_url': session.url,
                'session_id': session.id
            }
        except Exception as e:
            logger.error(f"Error creating checkout session: {str(e)}")
            raise
    
    @staticmethod
    async def create_customer_portal_session(
        customer_id: str,
        return_url: str
    ) -> dict:
        """Create a customer portal session for managing subscription."""
        try:
            session = stripe.billing_portal.Session.create(
                customer=customer_id,
                return_url=return_url,
            )
            
            return {
                'portal_url': session.url
            }
        except Exception as e:
            logger.error(f"Error creating portal session: {str(e)}")
            raise
    
    @staticmethod
    async def get_subscription(subscription_id: str) -> Optional[dict]:
        """Get subscription details."""
        try:
            subscription = stripe.Subscription.retrieve(subscription_id)
            return {
                'id': subscription.id,
                'status': subscription.status,
                'current_period_end': subscription.current_period_end,
                'plan': subscription.items.data[0].price.id if subscription.items.data else None
            }
        except Exception as e:
            logger.error(f"Error fetching subscription: {str(e)}")
            return None
    
    @staticmethod
    async def cancel_subscription(subscription_id: str) -> bool:
        """Cancel a subscription."""
        try:
            stripe.Subscription.delete(subscription_id)
            return True
        except Exception as e:
            logger.error(f"Error canceling subscription: {str(e)}")
            return False


