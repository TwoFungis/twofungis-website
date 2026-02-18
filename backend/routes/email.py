import os
import asyncio
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/api/email", tags=["email"])
logger = logging.getLogger(__name__)

# Check if resend is available
try:
    import resend
    RESEND_API_KEY = os.environ.get("RESEND_API_KEY")
    if RESEND_API_KEY:
        resend.api_key = RESEND_API_KEY
        EMAIL_ENABLED = True
    else:
        EMAIL_ENABLED = False
        logger.warning("RESEND_API_KEY not configured - email sending disabled")
except ImportError:
    EMAIL_ENABLED = False
    logger.warning("resend package not installed - email sending disabled")

SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")


class InvoiceEmailRequest(BaseModel):
    recipient_email: EmailStr
    recipient_name: str
    invoice_number: str
    project_name: str
    milestone_name: str
    amount: float
    due_date: str
    company_name: str
    payment_terms: int = 30


def generate_invoice_email_html(data: InvoiceEmailRequest) -> str:
    """Generate professional HTML email for invoice notification"""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f5f5f5;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
                <td align="center" style="padding: 40px 20px;">
                    <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%); padding: 30px 40px; border-radius: 8px 8px 0 0;">
                                <table role="presentation" style="width: 100%;">
                                    <tr>
                                        <td>
                                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">INVOICE</h1>
                                            <p style="margin: 5px 0 0; color: #5a8fb8; font-size: 14px;">{data.invoice_number}</p>
                                        </td>
                                        <td align="right">
                                            <p style="margin: 0; color: #ffffff; font-size: 16px; font-weight: bold;">{data.company_name}</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        
                        <!-- Content -->
                        <tr>
                            <td style="padding: 40px;">
                                <p style="margin: 0 0 20px; color: #333333; font-size: 16px;">
                                    Hi {data.recipient_name},
                                </p>
                                <p style="margin: 0 0 30px; color: #666666; font-size: 14px; line-height: 1.6;">
                                    A new invoice has been generated for the completion of a project milestone. Please review the details below.
                                </p>
                                
                                <!-- Invoice Details Box -->
                                <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8f9fa; border-radius: 8px; margin-bottom: 30px;">
                                    <tr>
                                        <td style="padding: 25px;">
                                            <table role="presentation" style="width: 100%;">
                                                <tr>
                                                    <td style="padding: 8px 0;">
                                                        <span style="color: #666666; font-size: 12px; text-transform: uppercase;">Project</span><br>
                                                        <span style="color: #333333; font-size: 16px; font-weight: 500;">{data.project_name}</span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 8px 0;">
                                                        <span style="color: #666666; font-size: 12px; text-transform: uppercase;">Milestone</span><br>
                                                        <span style="color: #333333; font-size: 16px; font-weight: 500;">{data.milestone_name}</span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 8px 0;">
                                                        <span style="color: #666666; font-size: 12px; text-transform: uppercase;">Due Date</span><br>
                                                        <span style="color: #333333; font-size: 16px; font-weight: 500;">{data.due_date}</span>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 8px 0;">
                                                        <span style="color: #666666; font-size: 12px; text-transform: uppercase;">Payment Terms</span><br>
                                                        <span style="color: #333333; font-size: 16px; font-weight: 500;">Net {data.payment_terms}</span>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                                
                                <!-- Amount Box -->
                                <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #5a8fb8; border-radius: 8px; margin-bottom: 30px;">
                                    <tr>
                                        <td style="padding: 25px;" align="center">
                                            <span style="color: rgba(255,255,255,0.8); font-size: 14px; text-transform: uppercase;">Amount Due</span><br>
                                            <span style="color: #ffffff; font-size: 36px; font-weight: bold;">${data.amount:,.2f}</span>
                                        </td>
                                    </tr>
                                </table>
                                
                                <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.6;">
                                    Please remit payment by <strong>{data.due_date}</strong>. If you have any questions about this invoice, please don't hesitate to reach out.
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #f8f9fa; padding: 20px 40px; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
                                <p style="margin: 0; color: #999999; font-size: 12px; text-align: center;">
                                    This invoice was generated by TradeOS™ - Built for Builders
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """


@router.post("/send-invoice")
async def send_invoice_email(request: InvoiceEmailRequest):
    """Send invoice notification email to client"""
    
    if not EMAIL_ENABLED:
        return {
            "status": "skipped",
            "message": "Email sending not configured. Set RESEND_API_KEY to enable.",
            "email_id": None
        }
    
    html_content = generate_invoice_email_html(request)
    
    params = {
        "from": SENDER_EMAIL,
        "to": [request.recipient_email],
        "subject": f"Invoice {request.invoice_number} - {request.project_name}",
        "html": html_content
    }
    
    try:
        # Run sync SDK in thread to keep FastAPI non-blocking
        email = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Invoice email sent to {request.recipient_email} for {request.invoice_number}")
        return {
            "status": "success",
            "message": f"Invoice email sent to {request.recipient_email}",
            "email_id": email.get("id")
        }
    except Exception as e:
        logger.error(f"Failed to send invoice email: {str(e)}")
        # Return success even if email fails - don't block invoice generation
        return {
            "status": "failed",
            "message": f"Invoice created but email failed: {str(e)}",
            "email_id": None
        }


@router.get("/status")
async def email_status():
    """Check if email sending is configured"""
    return {
        "email_enabled": EMAIL_ENABLED,
        "sender_email": SENDER_EMAIL if EMAIL_ENABLED else None
    }
