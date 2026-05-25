import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Import Models
import User from '../models/User.js';
import Lead from '../models/Lead.js';
import FollowUp from '../models/FollowUp.js';
import Client from '../models/Client.js';
import Activity from '../models/Activity.js';

dotenv.config();

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm';
    console.log('Connecting to database for seeding...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    // 1. Clean existing records
    console.log('Clearing existing database collections...');
    await User.deleteMany({});
    await Lead.deleteMany({});
    await FollowUp.deleteMany({});
    await Client.deleteMany({});
    await Activity.deleteMany({});
    console.log('Database cleared.');

    // 2. Create Users
    console.log('Creating seed Users (hash actions executing)...');
    const users = await User.create([
      {
        name: 'CRM Admin',
        email: 'admin@crm.com',
        password: 'password123', // Will be hashed automatically by pre('save') hook
        role: 'Admin',
      },
      {
        name: 'Sales Manager',
        email: 'manager@crm.com',
        password: 'password123',
        role: 'Manager',
      },
      {
        name: 'Venkat',
        email: 'venkat@crm.com',
        password: 'password123',
        role: 'Employee',
      },
      {
        name: 'Vicky',
        email: 'vicky@crm.com',
        password: 'password123',
        role: 'Employee',
      },
    ]);

    const admin = users[0];
    const manager = users[1];
    const venkat = users[2];
    const vicky = users[3];

    console.log('Users created successfully.');

    // 3. Create Leads
    console.log('Creating seed Leads & Activities...');
    const leads = [
      {
        name: 'TechCorp Solutions',
        company: 'TechCorp Industries',
        email: 'contact@techcorp.com',
        phone: '+1-555-0199',
        source: 'Website',
        status: 'Converted',
        assignedTo: venkat._id,
        createdBy: manager._id,
        estimatedValue: 15000,
      },
      {
        name: 'Alpha Retailers',
        company: 'Alpha LLC',
        email: 'procurement@alpharetail.com',
        phone: '+1-555-0144',
        source: 'Referral',
        status: 'Follow-up',
        assignedTo: venkat._id,
        createdBy: admin._id,
        estimatedValue: 8000,
      },
      {
        name: 'Zeta Software Co',
        company: 'Zeta Technologies',
        email: 'ceo@zetasoftware.io',
        phone: '+1-555-0182',
        source: 'Cold Call',
        status: 'New',
        assignedTo: vicky._id,
        createdBy: venkat._id,
        estimatedValue: 25000,
      },
      {
        name: 'Bright Builders',
        company: 'Bright Developments',
        email: 'leads@brightbuilders.com',
        phone: '+1-555-0120',
        source: 'Google Ads',
        status: 'Proposal Sent',
        assignedTo: vicky._id,
        createdBy: manager._id,
        estimatedValue: 42000,
      },
      {
        name: 'Pinnacle Consulting',
        company: 'Pinnacle Partners',
        email: 'info@pinnacle.com',
        phone: '+1-555-0111',
        source: 'Social Media',
        status: 'Interested',
        assignedTo: null,
        createdBy: admin._id,
        estimatedValue: 12000,
      },
    ];

    const createdLeads = await Lead.create(leads);
    console.log('Leads created.');

    // 4. Create Activity Logs & Clients for Converted Leads
    console.log('Populating Activity logs and Client conversions...');
    for (const lead of createdLeads) {
      // General creation logs
      await Activity.create({
        lead: lead._id,
        performedBy: lead.createdBy,
        action: 'Lead Created',
        details: 'Initial seed entry created in the CRM',
      });

      if (lead.assignedTo) {
        await Activity.create({
          lead: lead._id,
          performedBy: lead.createdBy,
          action: 'Lead Assigned',
          details: `Assigned automatically during seed population`,
        });
      }

      // Convert TechCorp to Client
      if (lead.name === 'TechCorp Solutions') {
        // Create Client
        await Client.create({
          lead: lead._id,
          dealValue: 14500, // Actual closed revenue
          contractStartDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          status: 'Active',
          billingDetails: 'Standard corporate software annual license fee.',
        });

        // Conversion activity log
        await Activity.create({
          lead: lead._id,
          performedBy: venkat._id,
          action: 'Lead Converted',
          details: 'TechCorp successfully closed by Venkat! Contract finalized.',
        });
      }
    }

    // 5. Create Follow-Up Schedules
    console.log('Creating follow-up reminder events...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);

    await FollowUp.create([
      {
        lead: createdLeads[1]._id, // Alpha Retailers (Follow-up)
        assignedTo: venkat._id,
        scheduledDate: tomorrow,
        note: 'Call Alpha Retailers procurement manager to review pricing proposal revisions.',
        status: 'Planned',
        type: 'Call',
      },
      {
        lead: createdLeads[3]._id, // Bright Builders (Proposal Sent)
        assignedTo: vicky._id,
        scheduledDate: dayAfter,
        note: 'Send email reminder regarding proposal feedback. Offer a quick demo call.',
        status: 'Planned',
        type: 'Email',
      },
    ]);

    console.log('Follow-ups populated successfully.');
    console.log('Database Seeding Complete!');
    process.exit(0);
  } catch (error) {
    console.error(`Database seeding execution failed: ${error.message}`);
    process.exit(1);
  }
};

seedDB();
