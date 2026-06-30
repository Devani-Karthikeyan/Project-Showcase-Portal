import User from '../models/User.js';
import Project from '../models/Project.js';
import Like from '../models/Like.js';
import Follow from '../models/Follow.js';
import Bookmark from '../models/Bookmark.js';
import Notification from '../models/Notification.js';
import University from '../models/University.js';
import DegreeProgram from '../models/DegreeProgram.js';

/**
 * Seeds the database with mock accounts, rich computing projects, and feedback reviews.
 */
export async function seedDatabase() {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('🌱 Database already seeded. Skipping initial seeding to preserve user modifications.');
      return;
    }


    console.log('🌱 Cleaning old demo data...');

    await University.deleteMany({});
    await DegreeProgram.deleteMany({});

    await University.insertMany([
      { name: 'University of Computing', location: 'Colombo, Sri Lanka' },
      { name: 'University of Colombo', location: 'Colombo, Sri Lanka' },
      { name: 'University of Moratuwa', location: 'Moratuwa, Sri Lanka' },
      { name: 'University of Kelaniya', location: 'Kelaniya, Sri Lanka' },
      { name: 'University of Peradeniya', location: 'Peradeniya, Sri Lanka' },
      { name: 'University of Sri Jayewardenepura', location: 'Nugegoda, Sri Lanka' }
    ]);

    await DegreeProgram.insertMany([
      { name: 'Software Engineering', code: 'SE' },
      { name: 'Computer Science', code: 'CS' },
      { name: 'Information Systems', code: 'IS' },
      { name: 'Computer Engineering', code: 'CE' },
      { name: 'Data Science', code: 'DS' },
      { name: 'Information Technology', code: 'IT' }
    ]);
    const demoEmails = [
      'chamika@student.uc.lk',
      'nethmi@student.uc.lk',
      'kasun@student.uc.lk',
      'athula@lecturer.uc.lk',
      'sarah.j@google.com',
      'admin@uc.lk'
    ];

    const demoUsers = await User.find({ email: { $in: demoEmails } });
    const demoUserIds = demoUsers.map(u => u._id);

    // Delete old demo projects
    const demoProjectTitles = [
      'Distributed Flight Booking Ledger',
      'AI-Powered Crop Disease Analyzer',
      'Enterprise NLP Customer Support LLM',
      'Autonomous Cyber Defense SIEM',
      'Cloud-Native Microservices E-Commerce Mesh',
      'Real-time Algorithmic Stock Predictor',
      'Immersive AR/VR Medical Anatomy Lab',
      'High-Throughput Real-Time Streaming Pipeline',
      'IoT Smart Greenhouse Controller',
      'Interactive 3D Campus Navigator'
    ];
    const demoProjects = await Project.find({ title: { $in: demoProjectTitles } });
    const demoProjectIds = demoProjects.map(p => p._id);

    await Project.deleteMany({ title: { $in: demoProjectTitles } });
    await User.deleteMany({ email: { $in: demoEmails } });
    await Like.deleteMany({ $or: [{ userId: { $in: demoUserIds } }, { projectId: { $in: demoProjectIds } }] });
    await Follow.deleteMany({ $or: [{ followerId: { $in: demoUserIds } }, { followedId: { $in: demoUserIds } }] });
    await Bookmark.deleteMany({ $or: [{ userId: { $in: demoUserIds } }, { projectId: { $in: demoProjectIds } }] });
    await Notification.deleteMany({ $or: [{ recipientId: { $in: demoUserIds } }, { senderId: { $in: demoUserIds } }, { projectId: { $in: demoProjectIds } }] });

    console.log('🌱 Seeding database with rich professional showcase projects and demo users...');

    // 1. Ensure Demo Users Exist
    const student = await User.create({
      googleId: 'demo-student-1',
      email: 'chamika@student.uc.lk',
      name: 'Chamika Perera',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Chamika',
      role: 'student',
      title: 'Undergraduate Software Engineer',
      bio: 'Fascinated by distributed systems, consensus algorithms, and decentralized architectures. Active computing researcher.',
      department: 'Software Engineering',
      faculty: 'Computing',
      graduationYear: 2026,
      settings: {
        notifications: {
          email: true,
          push: true,
          activity: true,
          followers: true,
          messages: true,
          summary: false,
          projectUpdates: true,
          commentsMentions: true,
          likesReactions: true,
          systemUpdates: true,
          dndEnabled: false
        }
      }
    });

    const student2 = await User.create({
      googleId: 'demo-student-2',
      email: 'nethmi@student.uc.lk',
      name: 'Nethmi Silva',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Nethmi',
      role: 'student',
      title: 'AI & Machine Learning Undergraduate',
      bio: 'Passionate about deep learning, computer vision, and real-time inference optimization.',
      department: 'Computer Science',
      faculty: 'Computing',
      graduationYear: 2026,
      settings: {
        notifications: {
          email: true,
          push: true,
          activity: true,
          followers: true,
          messages: true,
          summary: false,
          projectUpdates: true,
          commentsMentions: true,
          likesReactions: true,
          systemUpdates: true,
          dndEnabled: false
        }
      }
    });

    const student3 = await User.create({
      googleId: 'demo-student-3',
      email: 'kasun@student.uc.lk',
      name: 'Kasun Jayawardena',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Kasun',
      role: 'student',
      title: 'Full-Stack Cloud Engineer',
      bio: 'Building resilient cloud-native microservices and reactive enterprise web applications.',
      department: 'Information Systems',
      faculty: 'Computing',
      graduationYear: 2025,
      isAlumni: true,
      settings: {
        notifications: {
          email: true,
          push: true,
          activity: true,
          followers: true,
          messages: true,
          summary: false,
          projectUpdates: true,
          commentsMentions: true,
          likesReactions: true,
          systemUpdates: true,
          dndEnabled: false
        }
      }
    });

    const lecturer = await User.create({
      googleId: 'demo-lecturer-1',
      email: 'athula@lecturer.uc.lk',
      name: 'Dr. Athula Senanayake',
      avatarUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=Athula',
      role: 'lecturer',
      title: 'Senior Lecturer / SE Department Head',
      bio: 'Specialized in Software Quality Assurance, Distributed Databases, and Enterprise Software Systems Architecture.',
      department: 'Software Engineering',
      faculty: 'Computing',
      settings: {
        notifications: {
          email: true,
          push: true,
          activity: true,
          followers: true,
          messages: true,
          summary: false,
          projectUpdates: true,
          commentsMentions: true,
          likesReactions: true,
          systemUpdates: true,
          dndEnabled: false
        }
      }
    });

    const recruiter = await User.create({
      googleId: 'demo-recruiter-1',
      email: 'sarah.j@google.com',
      name: 'Sarah Jenkins',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      role: 'recruiter',
      company: 'Google APAC',
      title: 'Talent Scout at Google',
      followedStudents: [student._id],
      settings: {
        notifications: {
          email: true,
          push: true,
          activity: true,
          followers: true,
          messages: true,
          summary: false,
          projectUpdates: true,
          commentsMentions: true,
          likesReactions: true,
          systemUpdates: true,
          dndEnabled: false
        }
      }
    });

    const admin = await User.create({
      googleId: 'demo-admin-1',
      email: 'admin@uc.lk',
      name: 'System Admin',
      avatarUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=Admin',
      role: 'admin',
      title: 'Showcase Portal Admin'
    });

    // 2. Create 10 Rich Pro-Level Projects
    const p1 = await Project.create({
      title: 'Distributed Flight Booking Ledger',
      description: 'A decentralized booking transaction engine built using Spring Boot, Java, and a lightweight Raft consensus algorithm. Solves double-booking risks and provides eventual consistency across multiple airport booking portals.',
      thumbnail: '/uploads/flight_ledger.png',
      demoUrl: 'https://flight-ledger.uc.lk',
      githubUrl: 'https://github.com/chamika/flight-ledger',
      studentId: student._id,
      modules: ['SENG 31242', 'COSC 41012'],
      department: 'Software Engineering',
      faculty: 'Computing',
      status: 'approved',
      restricted: false,
      featured: true,
      likesCount: 13,
      viewsCount: 342,
      feedback: [{
        lecturerId: lecturer._id,
        comment: 'Excellent implementation of consensus in airline transactions. Robust testing coverage. Approved.',
        rating: 5
      }]
    });

    const p2 = await Project.create({
      title: 'AI-Powered Crop Disease Analyzer',
      description: 'A mobile-first computer vision platform using React Native, Python, and PyTorch to classify plant leaf diseases in real-time. Achieves a 94.2% accuracy score and gives agriculturalists actionable treatment steps.',
      thumbnail: '/uploads/crop_vision.png',
      demoUrl: 'https://crop-vision-ai.org',
      githubUrl: 'https://github.com/nethmi/crop-vision-ai',
      studentId: student2._id,
      modules: ['COSC 32011', 'SENG 42022'],
      department: 'Computer Science',
      faculty: 'Computing',
      status: 'approved',
      restricted: false,
      featured: true,
      likesCount: 24,
      viewsCount: 512
    });

    const p3 = await Project.create({
      title: 'Enterprise NLP Customer Support LLM',
      description: 'Fine-tuned Llama-3 model deployed on Kubernetes with vLLM for automated enterprise customer ticket routing and sentiment analysis. Features RAG integration with proprietary knowledge bases.',
      thumbnail: '/uploads/nlp_chatbot.png',
      demoUrl: 'https://nlp-support-ai.uc.lk',
      githubUrl: 'https://github.com/nethmi/enterprise-nlp',
      studentId: student2._id,
      modules: ['COSC 41022'],
      department: 'Computer Science',
      faculty: 'Computing',
      status: 'approved',
      restricted: false,
      featured: true,
      likesCount: 18,
      viewsCount: 420
    });

    const p4 = await Project.create({
      title: 'Autonomous Cyber Defense SIEM',
      description: 'Real-time security information and event management system built with Golang, Elasticsearch, and eBPF kernel tracing to autonomously detect and mitigate zero-day network intrusions.',
      thumbnail: '/uploads/cyber_defense.png',
      demoUrl: 'https://siem-defense.io',
      githubUrl: 'https://github.com/kasun/autonomous-siem',
      studentId: student3._id,
      modules: ['INFO 32041'],
      department: 'Information Systems',
      faculty: 'Computing',
      status: 'approved',
      restricted: false,
      featured: true,
      likesCount: 31,
      viewsCount: 890
    });

    const p5 = await Project.create({
      title: 'Cloud-Native Microservices E-Commerce Mesh',
      description: 'An event-driven microservice architecture utilizing NestJS, Kafka, Docker Swarm, and Redis. Features distributed saga patterns for inventory reserving and payment settlement.',
      thumbnail: '/uploads/cloud_native.png',
      demoUrl: 'https://cloud-mesh-store.com',
      githubUrl: 'https://github.com/kasun/cloud-mesh',
      studentId: student3._id,
      modules: ['INFO 41011'],
      department: 'Information Systems',
      faculty: 'Computing',
      status: 'approved',
      restricted: false,
      featured: false,
      likesCount: 9,
      viewsCount: 215
    });

    const p6 = await Project.create({
      title: 'Real-time Algorithmic Stock Predictor',
      description: 'Low-latency quantitative financial trading dashboard built with Python, WebSockets, and LSTM neural networks. Ingests tick data to predict short-term equity price movements.',
      thumbnail: '/uploads/stock_predictor.png',
      demoUrl: 'https://quant-predictor.financial',
      githubUrl: 'https://github.com/chamika/stock-quant',
      studentId: student._id,
      modules: ['SENG 31242'],
      department: 'Software Engineering',
      faculty: 'Computing',
      status: 'approved',
      restricted: false,
      featured: false,
      likesCount: 14,
      viewsCount: 310
    });

    const p7 = await Project.create({
      title: 'Immersive AR/VR Medical Anatomy Lab',
      description: 'Virtual reality medical training simulation created in Unity and C# for Oculus Quest 3. Allows medical undergraduates to interactively dissect and explore 3D human organ systems.',
      thumbnail: '/uploads/ar_vr_anatomy.png',
      demoUrl: 'https://vr-anatomy-lab.org',
      githubUrl: 'https://github.com/chamika/vr-anatomy',
      studentId: student._id,
      modules: ['SENG 42011'],
      department: 'Software Engineering',
      faculty: 'Computing',
      status: 'approved',
      restricted: false,
      featured: false,
      likesCount: 7,
      viewsCount: 180
    });

    const p8 = await Project.create({
      title: 'High-Throughput Real-Time Streaming Pipeline',
      description: 'Apache Flink and Apache Iceberg data lakehouse pipeline processing over 100,005 telemetry events per second with sub-second analytical querying capabilities.',
      thumbnail: '/uploads/data_pipeline.png',
      demoUrl: 'https://stream-analytics.uc.lk',
      githubUrl: 'https://github.com/nethmi/flink-iceberg',
      studentId: student2._id,
      modules: ['COSC 31042'],
      department: 'Computer Science',
      faculty: 'Computing',
      status: 'approved',
      restricted: false,
      featured: false,
      likesCount: 11,
      viewsCount: 195
    });

    const p9 = await Project.create({
      title: 'IoT Smart Greenhouse Controller',
      description: 'Physical hardware prototype utilizing Raspberry Pi and ESP32 nodes to automate greenhouse soil humidity, temperature, and light levels. Includes a real-time analytics web dashboard.',
      thumbnail: '/uploads/smart_greenhouse.png',
      studentId: student._id,
      modules: ['SENG 22041'],
      department: 'Software Engineering',
      faculty: 'Computing',
      status: 'pending_approval',
      restricted: true,
      viewsCount: 18
    });

    const p10 = await Project.create({
      title: 'Interactive 3D Campus Navigator',
      description: 'Web navigation portal for university buildings utilizing ThreeJS and WebGL to render an interactive map pins utility. Helps freshmen locate computing labs and offices.',
      thumbnail: '/uploads/campus_navigation.png',
      studentId: student._id,
      modules: ['INFO 31022'],
      department: 'Software Engineering',
      faculty: 'Computing',
      status: 'approved',
      restricted: false,
      likesCount: 5,
      viewsCount: 87
    });

    // 3. Seed Likes
    await Like.create({ userId: recruiter._id, projectId: p1._id });
    await Like.create({ userId: recruiter._id, projectId: p2._id });
    await Like.create({ userId: recruiter._id, projectId: p4._id });
    await Like.create({ userId: student2._id, projectId: p1._id });
    await Like.create({ userId: student2._id, projectId: p6._id });
    await Like.create({ userId: student2._id, projectId: p7._id });
    await Like.create({ userId: lecturer._id, projectId: p1._id });

    // 4. Seed Followings
    await Follow.create({ followerId: recruiter._id, followedId: student._id });
    await Follow.create({ followerId: student._id, followedId: student2._id });
    await Follow.create({ followerId: student._id, followedId: student3._id });

    // 5. Seed Bookmarks
    await Bookmark.create({ userId: student._id, projectId: p2._id });
    await Bookmark.create({ userId: student._id, projectId: p4._id });

    // 6. Seed Notifications
    // Notifications for Chamika Perera
    await Notification.create({
      recipientId: student._id,
      senderId: recruiter._id,
      type: 'user_followed',
      message: `${recruiter.name} started following you.`
    });

    await Notification.create({
      recipientId: student._id,
      senderId: lecturer._id,
      type: 'feedback_added',
      projectId: p1._id,
      message: `Excellent implementation of consensus in airline transactions. Robust testing coverage. Approved.`
    });

    await Notification.create({
      recipientId: student._id,
      senderId: student2._id,
      type: 'project_liked',
      projectId: p1._id,
      message: `${student2.name} liked your project "Distributed Flight Booking Ledger".`
    });

    await Notification.create({
      recipientId: student._id,
      senderId: recruiter._id,
      type: 'project_liked',
      projectId: p1._id,
      message: `${recruiter.name} liked your project "Distributed Flight Booking Ledger".`
    });

    // System Update notification
    await Notification.create({
      recipientId: student._id,
      type: 'project_approved',
      message: "We've added advanced search filters to help you find projects faster."
    });

    // Notifications for Lecturer Athula
    await Notification.create({
      recipientId: lecturer._id,
      senderId: student._id,
      type: 'project_created',
      projectId: p9._id,
      message: `${student.name} submitted a new project "IoT Smart Greenhouse Controller" for approval.`
    });

    console.log('✅ Database successfully seeded with full rich mock relationships!');
  } catch (err) {
    console.error('❌ Error seeding database:', err);
  }
}

export default seedDatabase;
