// Quick test script to verify email configuration
import { verifyEmailConfig, sendEmail } from './src/lib/email';

async function testEmail() {
  console.log('🔍 Testing email configuration...\n');

  // Verify configuration
  console.log('1. Verifying SMTP connection...');
  const verification = await verifyEmailConfig();
  console.log(verification);

  if (verification.success) {
    console.log('\n✅ Email configuration is valid!\n');
    
    // Send a test email
    console.log('2. Sending test email...');
    const result = await sendEmail({
      to: 'blunira.official@gmail.com', // Send to yourself for testing
      subject: 'Blunira Order System - Test Email',
      html: `
        <h1 style="color: #06b6d4;">🎉 Email System Working!</h1>
        <p>Your Blunira Order Management System email service is configured correctly.</p>
        <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
        <hr>
        <p style="color: #64748b; font-size: 12px;">This is a test email from Blunira Order Management System</p>
      `,
      text: 'Email System Working! Your Blunira Order Management System email service is configured correctly.',
    });

    if (result.success) {
      console.log('✅ Test email sent successfully!');
      console.log('Message ID:', result.messageId);
      console.log('\n📧 Check your inbox: blunira.official@gmail.com\n');
    } else {
      console.log('❌ Failed to send test email:', result.error);
    }
  } else {
    console.log('\n❌ Email configuration failed:', verification.message);
    console.log('\nPlease check:');
    console.log('  - SMTP credentials are correct');
    console.log('  - App password is valid (not regular Gmail password)');
    console.log('  - Port 587 is not blocked by firewall');
  }
}

testEmail().catch(console.error);
