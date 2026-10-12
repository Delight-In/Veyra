import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { ContentNodeModel } from '../models/ContentNode';
import { initialNodes } from '../../src/data/initialNodes';

export async function seedDatabase() {
  try {
    const salt = await bcrypt.genSalt(12);

    // 1. Seed Content Nodes if empty
    const contentNodeCount = await ContentNodeModel.countDocuments();
    if (contentNodeCount === 0) {
      console.log('🌱 MongoDB: Seeding initial course hierarchy nodes into MongoDB...');
      const preparedNodes = initialNodes.map(node => ({
        ...node,
        createdBy: node.createdBy || 'user_super_admin'
      }));
      await ContentNodeModel.insertMany(preparedNodes, { ordered: false });
      console.log(`✅ MongoDB: Successfully seeded ${preparedNodes.length} content nodes!`);
    } else {
      console.log(`ℹ️ MongoDB: Content hierarchy already populated with ${contentNodeCount} nodes.`);
    }

    // 2. Ensure Priyanka Super Admin is always seeded into MongoDB
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'priyanka@veyra.com';
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123';
    const priyankaExists = await User.findOne({ email: adminEmail });
    if (!priyankaExists) {
      console.log(`🌱 MongoDB: Seeding Super Admin Priyanka (${adminEmail})...`);
      await User.create({
        name: 'Priyanka (प्रियंका - Founder & CAO)',
        email: adminEmail,
        password: await bcrypt.hash(adminPassword, salt),
        role: 'super_admin',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
        isEmailVerified: true,
        enrolledCourseIds: ['node_science', 'node_math', 'node_cs', 'node_kids_universe'],
        completedNodeIds: [],
        adminRemarks: [{
          id: 'rem_priyanka_1',
          authorName: 'System Governance',
          authorRole: 'super_admin',
          text: 'Founder & Chief Administrator. Physics Honours Graduate & IT Specialist. Full platform authority.',
          timestamp: new Date().toISOString(),
          flag: 'good'
        }],
        notifications: [{
          id: 'notif_priyanka_1',
          title: 'Super Admin Access Active',
          message: 'Welcome to Veyra platform administration console, Priyanka.',
          sender: 'Veyra System Security',
          timestamp: new Date().toISOString(),
          read: false,
          priority: 'urgent'
        }]
      });
    }

    const count = await User.countDocuments();
    if (count > 1) {
      console.log(`ℹ️ MongoDB: Database already populated with ${count} users. Additional seeding skipped.`);
      return;
    }

    console.log('🌱 MongoDB: Seeding initial enterprise users into local database...');

    const initialSeedUsers = [
      {
        name: 'Priyanka (प्रियंका - Founder & CAO)',
        email: 'priyanka@veyra.com',
        password: await bcrypt.hash('Admin@123', salt),
        role: 'super_admin',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
        isEmailVerified: true,
        enrolledCourseIds: ['node_science', 'node_math', 'node_cs', 'node_kids_universe'],
        completedNodeIds: [],
        adminRemarks: [{
          id: 'rem_priyanka_1',
          authorName: 'System Governance',
          authorRole: 'super_admin',
          text: 'Founder & Chief Administrator. Physics Honours Graduate & IT Specialist. Full platform authority.',
          timestamp: new Date().toISOString(),
          flag: 'good'
        }],
        notifications: [{
          id: 'notif_priyanka_1',
          title: 'Super Admin Access Active',
          message: 'Welcome to Veyra platform administration console, Priyanka.',
          sender: 'Veyra System Security',
          timestamp: new Date().toISOString(),
          read: false,
          priority: 'urgent'
        }]
      },
      {
        name: 'Dr. Vikram Malhotra',
        email: 'admin@edunova.org',
        password: await bcrypt.hash('Admin@123', salt),
        role: 'super_admin',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
        isEmailVerified: true,
        enrolledCourseIds: ['node_science', 'node_math', 'node_cs'],
        completedNodeIds: [],
        adminRemarks: [{
          id: 'rem_init_1',
          authorName: 'System Founder',
          authorRole: 'super_admin',
          text: 'Root administrator account created. Governs platform-wide branches, course permissions, and user remarks.',
          timestamp: new Date().toISOString(),
          flag: 'good'
        }],
        notifications: [{
          id: 'notif_1',
          title: 'System Initialized',
          message: 'EduNova MongoDB database engine active. Email verification service standing by.',
          sender: 'EduNova Core',
          timestamp: new Date().toISOString(),
          read: false,
          priority: 'info'
        }]
      },
      {
        name: 'Prof. Ananya Sen',
        email: 'science.admin@edunova.org',
        password: await bcrypt.hash('Branch@123', salt),
        role: 'branch_admin',
        branchCategory: 'pcmb',
        assignedNodeId: 'node_science',
        assignedBranchName: 'PCMB Science (Physics, Chemistry, Math, Biology)',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
        isEmailVerified: true,
        enrolledCourseIds: ['node_science'],
        completedNodeIds: [],
        adminRemarks: [],
        notifications: []
      },
      {
        name: 'Dr. Sameer Khan',
        email: 'cs.admin@edunova.org',
        password: await bcrypt.hash('Branch@123', salt),
        role: 'branch_admin',
        branchCategory: 'cs',
        assignedNodeId: 'node_cs',
        assignedBranchName: 'Computer Science & Software Systems',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
        isEmailVerified: true,
        enrolledCourseIds: ['node_cs'],
        completedNodeIds: [],
        adminRemarks: [],
        notifications: []
      },
      {
        name: 'Rohan Sharma',
        email: 'physics.creator@edunova.org',
        password: await bcrypt.hash('Creator@123', salt),
        role: 'content_creator',
        branchCategory: 'pcmb',
        assignedNodeId: 'node_physics',
        assignedBranchName: 'Physics & Classical Mechanics',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
        isEmailVerified: true,
        enrolledCourseIds: ['node_science'],
        completedNodeIds: [],
        adminRemarks: [],
        notifications: []
      },
      {
        name: 'Neha Gupta',
        email: 'cs.creator@edunova.org',
        password: await bcrypt.hash('Creator@123', salt),
        role: 'content_creator',
        branchCategory: 'cs',
        assignedNodeId: 'node_cs',
        assignedBranchName: 'Computer Science Algorithms Lab',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200',
        isEmailVerified: true,
        enrolledCourseIds: ['node_cs'],
        completedNodeIds: [],
        adminRemarks: [],
        notifications: []
      },
      {
        name: 'Sunita Verma',
        email: 'hindi.reviewer@edunova.org',
        password: await bcrypt.hash('Reviewer@123', salt),
        role: 'reviewer',
        branchCategory: 'other',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
        isEmailVerified: true,
        enrolledCourseIds: ['node_science', 'node_math', 'node_cs'],
        completedNodeIds: [],
        adminRemarks: [],
        notifications: []
      },
      {
        name: 'Aarav Patel',
        email: 'aarav.learner@edunova.org',
        password: await bcrypt.hash('Learner@123', salt),
        role: 'learner',
        studentId: 'STU-1001',
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
        isEmailVerified: true,
        enrolledCourseIds: ['node_science', 'node_math', 'node_cs'],
        completedNodeIds: ['node_motion_1d'],
        adminRemarks: [
          {
            id: 'rem_aarav_1',
            authorName: 'Dr. Vikram Malhotra',
            authorRole: 'super_admin',
            text: 'Nominated for State Science Olympiad preparation track due to exceptional kinematics accuracy.',
            timestamp: new Date().toISOString(),
            flag: 'good'
          }
        ],
        notifications: [
          {
            id: 'notif_aarav_1',
            title: 'Olympiad Track Recommendation',
            message: 'You have been awarded access to the advanced Mechanics Simulation Sandbox.',
            sender: 'Super Administration',
            timestamp: new Date().toISOString(),
            read: false,
            priority: 'urgent'
          }
        ]
      },
      {
        name: 'Anaya Patel',
        email: 'anaya.learner@edunova.org',
        password: await bcrypt.hash('Learner@123', salt),
        role: 'learner',
        studentId: 'STU-1002',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
        isEmailVerified: true,
        enrolledCourseIds: ['node_science'],
        completedNodeIds: [],
        adminRemarks: [],
        notifications: []
      }
    ];

    await User.insertMany(initialSeedUsers);
    console.log(`✅ MongoDB: Successfully seeded ${initialSeedUsers.length} enterprise accounts with verified emails!`);
  } catch (err: any) {
    console.error('❌ MongoDB: Seed failure:', err.message);
  }
}
