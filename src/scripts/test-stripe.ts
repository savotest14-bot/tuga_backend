import * as dotenv from 'dotenv';
import * as path from 'path';
import Stripe from 'stripe';

dotenv.config({ path: path.join(process.cwd(), '.env') });

async function main() {
  console.log('==================================================');
  console.log('         Stripe Configuration Diagnostic          ');
  console.log('==================================================');

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;

  console.log('Publishable Key:', publishableKey ? `${publishableKey.substring(0, 14)}...` : '(not set)');
  console.log('Secret Key:     ', secretKey ? `${secretKey.substring(0, 14)}...` : '(not set)');
  console.log('--------------------------------------------------');

  if (!secretKey) {
    console.error('❌ STRIPE_SECRET_KEY is not defined in .env!');
    process.exit(1);
  }

  const stripe = new Stripe(secretKey);

  try {
    console.log('Connecting to Stripe API...');
    const balance = await stripe.balance.retrieve();
    console.log('✅ Connection SUCCESSFUL!');
    console.log('Live Mode:      ', balance.livemode ? 'Live' : 'Test / Sandbox');
    console.log('Available:      ', balance.available.map((b) => `${b.amount / 100} ${b.currency.toUpperCase()}`).join(', ') || '0.00 EUR');
    console.log('Pending:        ', balance.pending.map((b) => `${b.amount / 100} ${b.currency.toUpperCase()}`).join(', ') || '0.00 EUR');

    // Test creating a dummy payment intent to test write access
    console.log('Testing PaymentIntent creation in Sandbox...');
    const pi = await stripe.paymentIntents.create({
      amount: 100, // 1.00 EUR
      currency: 'eur',
      description: 'Stripe Diagnostics Check',
      metadata: { test: 'true' },
    });
    console.log(`✅ PaymentIntent created successfully! ID: ${pi.id}`);
    console.log(`Client Secret: ${pi.client_secret?.substring(0, 15)}...`);

    // Clean up by cancelling the test intent
    await stripe.paymentIntents.cancel(pi.id);
    console.log(`Cleaned up test PaymentIntent (${pi.id}).`);

    console.log('--------------------------------------------------');
    console.log('🎉 Stripe is fully operational and ready for payments!');
    console.log('==================================================');
  } catch (err: any) {
    console.error('❌ Stripe Error:', err.message);
    process.exit(1);
  }
}

main().catch(console.error);
