import resend

resend.api_key = "re_Ev1bAfrR_EmBj2MpuvyGL8JrF6bzfJdrC"

def send_hi_email():
    print("Function started")
    try:
        params = {
            "from": "Fares Trad <onboarding@resend.dev>",
            "to": ["faresgts0@gmail.com"],
            "subject": "Congratulations! You Won the someething!",
            "html": "<h1>🎉 Congratulations! 🎉</h1><p>You have successfully won the auction!</p>",
        }
        response = resend.Emails.send(params)
        print("Email sent:", response)
        return response
    except Exception as e:
        print("Failed to send email:", str(e))
        raise e

def send_auction_end_notification(winner_email: str, seller_email: str, item_name: str, winning_amount: float):
    """
    Send notifications to both the winner and seller when an auction ends
    """
    try:
        # Send to winner
        winner_params = {
            "from": "BidWize <onboarding@resend.dev>",
            "to": [winner_email],
            "subject": "🎉 Congratulations! You Won the Someething2!",
            "html": f"""
                <h1>🎉 Congratulations! 🎉</h1>
                <p>You have successfully won the auction for {item_name}!</p>
                <p>Winning Amount: ${winning_amount:.2f}</p>
                <p>Please proceed to complete your purchase.</p>
            """,
        }
        winner_response = resend.Emails.send(winner_params)
        print("Winner notification sent:", winner_response)

        # Send to seller
        seller_params = {
            "from": "BidWize <onboarding@resend.dev>",
            "to": [seller_email],
            "subject": "Your Auction Has Ended",
            "html": f"""
                <h1>Your Auction Has Ended</h1>
                <p>The auction for {item_name} has ended successfully.</p>
                <p>Final Price: ${winning_amount:.2f}</p>
                <p>We'll notify you once the buyer completes their purchase.</p>
            """,
        }
        seller_response = resend.Emails.send(seller_params)
        print("Seller notification sent:", seller_response)

        return {
            "winner_email_sent": winner_response,
            "seller_email_sent": seller_response
        }
    except Exception as e:
        print("Failed to send auction end notifications:", str(e))
        raise e

send_hi_email()