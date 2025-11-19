import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle, FileText, Send, AlertCircle, ExternalLink, Loader, ChevronDown, ChevronUp, BookOpen, Lightbulb } from 'lucide-react';
import * as mammoth from 'mammoth';

// Version 3.0 - With phase celebrations
const CareerPathAI = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [fileName, setFileName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [extractedData, setExtractedData] = useState(null);
  const [formData, setFormData] = useState({
    motivation: '',
    challenges: '',
    hoursPerWeek: 10
  });
  const [showTimelineCalc, setShowTimelineCalc] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [completedActions, setCompletedActions] = useState({});
  const [customRoadmap, setCustomRoadmap] = useState(null);
  const [expandedTips, setExpandedTips] = useState({});
  const [expandedStudyGuides, setExpandedStudyGuides] = useState({});
  const [showCelebration, setShowCelebration] = useState(null); // null, 'phase1', 'phase2', 'phase3'
  const [celebratedPhases, setCelebratedPhases] = useState({}); // Track which phases have been celebrated

  const handleReset = () => {
    setCurrentStep(1);
    setIsAnalyzing(false);
    setFileName('');
    setSelectedFile(null);
    setResumeText('');
    setExtractedData(null);
    setFormData({
      motivation: '',
      challenges: '',
      hoursPerWeek: 10
    });
    setShowTimelineCalc(false);
    setEditMode(false);
    setCompletedActions({});
    setCustomRoadmap(null);
    setExpandedTips({});
    setExpandedStudyGuides({});
    setShowCelebration(null);
    setCelebratedPhases({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleTips = (phaseIdx, actionIdx) => {
    const key = `${phaseIdx}-${actionIdx}`;
    setExpandedTips(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleStudyGuide = (phaseIdx, actionIdx) => {
    const key = `${phaseIdx}-${actionIdx}`;
    setExpandedStudyGuides(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleToggleComplete = (phaseIdx, actionIdx) => {
    const key = `${phaseIdx}-${actionIdx}`;
    setCompletedActions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleDeleteAction = (phaseIdx, actionIdx) => {
    const updatedRoadmap = { ...customRoadmap };
    const phaseKey = phaseIdx === 0 ? 'phase1' : phaseIdx === 1 ? 'phase2' : 'phase3';
    updatedRoadmap[phaseKey].actions.splice(actionIdx, 1);
    setCustomRoadmap(updatedRoadmap);
  };

  const handleAddAction = (phaseIdx) => {
    const newAction = {
      action: 'New custom action',
      skills: ['Custom skill'],
      effortHours: 10,
          time: calculateTime(10, hoursPerWeek),
      priority: 'MEDIUM',
      isCustom: true
    };
    
    const updatedRoadmap = { ...customRoadmap };
    const phaseKey = phaseIdx === 0 ? 'phase1' : phaseIdx === 1 ? 'phase2' : 'phase3';
    updatedRoadmap[phaseKey].actions.push(newAction);
    setCustomRoadmap(updatedRoadmap);
  };

  const handleEditAction = (phaseIdx, actionIdx, field, value) => {
    const updatedRoadmap = { ...customRoadmap };
    const phaseKey = phaseIdx === 0 ? 'phase1' : phaseIdx === 1 ? 'phase2' : 'phase3';
    updatedRoadmap[phaseKey].actions[actionIdx][field] = value;
    setCustomRoadmap(updatedRoadmap);
  };

  const calculateProgress = () => {
    const totalActions = [roadmap.phase1, roadmap.phase2, roadmap.phase3].reduce(
      (sum, phase) => sum + phase.actions.length,
      0
    );
    const completedCount = Object.values(completedActions).filter(Boolean).length;
    return {
      percentage: Math.round((completedCount / totalActions) * 100),
      completed: completedCount,
      total: totalActions
    };
  };

  // Helper function to calculate dynamic time based on effort hours and user's hours/week
  const calculateTime = (effortHours, hoursPerWeek) => {
    const weeks = Math.ceil(effortHours / hoursPerWeek);
    
    if (weeks <= 1) return '1 week';
    if (weeks === 2) return '2 weeks';
    if (weeks === 3) return '3 weeks';
    if (weeks >= 4 && weeks <= 6) return `${weeks} weeks`;
    if (weeks >= 7 && weeks <= 12) return `${Math.ceil(weeks / 4)}-${Math.ceil(weeks / 4) + 1} months`;
    return `${Math.ceil(weeks / 4)} months`;
  };

  // Helper function to adjust effort based on user background
  const adjustEffort = (baseEffort, parsed, actionType) => {
    let multiplier = 1.0;
    
    // Engineers get 70% reduction on technical tasks
    if (actionType === 'sql' && (parsed.skills.includes('Python') || parsed.skills.includes('Java') || parsed.skills.includes('JavaScript'))) {
      multiplier = 0.3;
    }
    
    // Analysts get 60% reduction on data tasks
    if (actionType === 'analytics' && (parsed.skills.includes('Excel') || parsed.skills.includes('Tableau') || parsed.skills.includes('Analytics'))) {
      multiplier = 0.4;
    }
    
    // PMs get 70% reduction on PM fundamentals
    if (actionType === 'pm-fundamentals' && parsed.hasProductExperience) {
      multiplier = 0.3;
    }
    
    // Students take 20% longer on everything (less context)
    if (parsed.isStudent && !parsed.hasProductExperience) {
      multiplier *= 1.2;
    }
    
    return Math.ceil(baseEffort * multiplier);
  };

  // Determine user experience level
  const getUserLevel = (parsed) => {
    let score = 0;
    
    if (parsed.hasProductExperience) score += 40;
    if (parsed.hasMetrics) score += 20;
    if (parsed.hasLeadership) score += 20;
    if (parsed.skills.length >= 5) score += 10;
    if (parsed.skills.includes('SQL')) score += 5;
    if (parsed.skills.includes('User Research') || parsed.skills.includes('Product Strategy')) score += 5;
    
    if (score >= 70) return { level: 'ADVANCED', badge: '🟣', startPhase: 3 };
    if (score >= 40) return { level: 'INTERMEDIATE', badge: '🔵', startPhase: 2 };
    return { level: 'BEGINNER', badge: '🟡', startPhase: 1 };
  };

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const parseResume = (text) => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const lowerText = text.toLowerCase();
    
    const results = {
      skills: [],
      currentRoles: [],
      currentRole: 'Not detected',
      isGraduated: true,
      educationLevel: 'Unknown',
      hasProductExperience: false,
      hasMetrics: false,
      hasLeadership: false,
      textLength: text.length,
      isStudent: false,
      campusActivities: [],
      pastInternships: []
    };
    
    // Enhanced skill detection with synonyms and contextual phrases
    const skillPatterns = {
      'SQL': ['sql', 'database query', 'database queries', 'postgresql', 'mysql', 'data extraction', 'queried database', 'writing queries', 'query language', 'relational database', 'bigquery', 'snowflake', 'redshift'],
      'Python': ['python', 'pandas', 'numpy', 'django', 'flask', 'jupyter', 'py script', 'python script'],
      'Excel': ['excel', 'spreadsheet', 'vlookup', 'pivot table', 'xlookup', 'google sheets', 'advanced formulas'],
      'Tableau': ['tableau', 'data visualization', 'dashboard', 'visual analytics', 'bi tool', 'power bi', 'looker', 'data studio'],
      'PowerPoint': ['powerpoint', 'presentation', 'deck', 'slide deck', 'keynote', 'google slides'],
      'Java': ['java', 'spring boot', 'jvm', 'j2ee'],
      'JavaScript': ['javascript', 'js', 'node.js', 'react', 'vue', 'angular', 'typescript'],
      'React': ['react', 'reactjs', 'react.js', 'jsx', 'react native'],
      'Analytics': ['analytics', 'data analysis', 'analyzed data', 'statistical analysis', 'quantitative analysis', 'metrics analysis'],
      'Data Analysis': ['data analysis', 'analyzed data', 'data analytics', 'analyze trends', 'data-driven', 'metrics'],
      'Project Management': ['project management', 'managed projects', 'project lead', 'project coordination', 'agile', 'scrum master', 'jira', 'asana', 'roadmap'],
      'Communication': ['communication', 'presented', 'stakeholder management', 'cross-functional collaboration', 'facilitated meetings', 'executive presentations'],
      'Leadership': ['leadership', 'led team', 'managed team', 'mentored', 'supervised', 'team lead', 'directed'],
      'Research': ['research', 'researched', 'conducted research', 'market research', 'competitive analysis'],
      'Google Analytics': ['google analytics', 'ga4', 'web analytics', 'analytics tracking', 'utm parameters'],
      'Figma': ['figma', 'design tool', 'prototyping', 'ui design', 'mockup'],
      'Git': ['git', 'github', 'gitlab', 'version control', 'bitbucket', 'source control'],
      'AWS': ['aws', 'amazon web services', 'ec2', 's3', 'lambda', 'cloud infrastructure'],
      'GCP': ['gcp', 'google cloud', 'cloud platform', 'google cloud platform'],
      'Agile': ['agile', 'scrum', 'sprint', 'kanban', 'agile methodology', 'iterative development'],
      'Scrum': ['scrum', 'scrum master', 'sprint planning', 'daily standup', 'retrospective'],
      'A/B Testing': ['a/b test', 'ab test', 'split test', 'multivariate test', 'experiment', 'experimentation', 'variant testing', 'conversion optimization'],
      'User Research': ['user research', 'user interview', 'customer interview', 'usability test', 'user testing', 'ethnographic research', 'field research', 'user feedback', 'customer insights'],
      'Wireframing': ['wireframe', 'wireframing', 'mockup', 'prototype', 'low-fidelity', 'sketch', 'design mockup'],
      'Product Strategy': ['product strategy', 'product vision', 'product roadmap', 'strategic planning', 'go-to-market', 'market strategy', 'product planning', 'competitive strategy']
    };

    // Check for each skill using multiple patterns
    Object.keys(skillPatterns).forEach(skill => {
      const patterns = skillPatterns[skill];
      for (let pattern of patterns) {
        if (lowerText.includes(pattern)) {
          results.skills.push(skill);
          break; // Found it, move to next skill
        }
      }
    });

    // Contextual skill inference - detect skills based on job context and responsibilities
    // This catches skills even when not explicitly mentioned by name
    
    // SQL/Data skills context
    if (!results.skills.includes('SQL') && 
        (lowerText.includes('data warehouse') || lowerText.includes('database') && (lowerText.includes('extract') || lowerText.includes('query')))) {
      results.skills.push('SQL');
    }
    
    // Analytics context
    if (!results.skills.includes('Analytics') && 
        ((lowerText.includes('analyzed') || lowerText.includes('analysis')) && (lowerText.includes('data') || lowerText.includes('metrics') || lowerText.includes('kpi')))) {
      results.skills.push('Analytics');
    }
    
    // User Research context
    if (!results.skills.includes('User Research') && 
        ((lowerText.includes('interview') && (lowerText.includes('user') || lowerText.includes('customer'))) ||
         (lowerText.includes('feedback') && lowerText.includes('user')) ||
         (lowerText.includes('survey') && (lowerText.includes('user') || lowerText.includes('customer'))))) {
      results.skills.push('User Research');
    }
    
    // A/B Testing context
    if (!results.skills.includes('A/B Testing') && 
        ((lowerText.includes('test') && (lowerText.includes('variant') || lowerText.includes('control'))) ||
         (lowerText.includes('experiment') && (lowerText.includes('conversion') || lowerText.includes('optimize'))) ||
         (lowerText.includes('compared') && lowerText.includes('version')))) {
      results.skills.push('A/B Testing');
    }
    
    // Product Strategy context
    if (!results.skills.includes('Product Strategy') && 
        ((lowerText.includes('product') && (lowerText.includes('roadmap') || lowerText.includes('vision') || lowerText.includes('strategy'))) ||
         (lowerText.includes('launch') && lowerText.includes('product')) ||
         (lowerText.includes('prioritize') && (lowerText.includes('feature') || lowerText.includes('backlog'))))) {
      results.skills.push('Product Strategy');
    }
    
    // Project Management context
    if (!results.skills.includes('Project Management') && 
        ((lowerText.includes('coordinated') || lowerText.includes('organized')) && (lowerText.includes('project') || lowerText.includes('initiative')) ||
         (lowerText.includes('timeline') && lowerText.includes('deliver')) ||
         (lowerText.includes('milestone') || lowerText.includes('deliverable')))) {
      results.skills.push('Project Management');
    }
    
    // Leadership context
    if (!results.skills.includes('Leadership') && 
        ((lowerText.includes('led') || lowerText.includes('lead')) && (lowerText.includes('team') || lowerText.includes('group') || lowerText.includes('initiative')) ||
         lowerText.includes('mentor') || lowerText.includes('coach') ||
         (lowerText.includes('manage') && lowerText.includes('people')))) {
      results.skills.push('Leadership');
    }
    
    // Wireframing/Design context
    if (!results.skills.includes('Wireframing') && 
        ((lowerText.includes('design') && (lowerText.includes('ui') || lowerText.includes('ux') || lowerText.includes('interface'))) ||
         lowerText.includes('wireframe') || lowerText.includes('mockup'))) {
      results.skills.push('Wireframing');
    }
    
    // Communication context (look for presentation/stakeholder work)
    if (!results.skills.includes('Communication') && 
        ((lowerText.includes('present') || lowerText.includes('communication')) ||
         (lowerText.includes('stakeholder') || lowerText.includes('cross-functional')))) {
      results.skills.push('Communication');
    }
    
    const studentKeywords = ['expected graduation', 'graduating', 'class of', 'expected to graduate', 'pursuing', 'candidate for', 'currently enrolled', 'undergraduate', 'sophomore', 'junior', 'senior', 'freshman'];
    
    for (let keyword of studentKeywords) {
      if (lowerText.includes(keyword)) {
        results.isStudent = true;
        results.isGraduated = false;
        break;
      }
    }
    
    if (text.includes('MBA') || text.includes('Master')) {
      results.educationLevel = 'Graduate degree';
    } else if (text.includes('Bachelor') || text.includes('B.S') || text.includes('B.A')) {
      results.educationLevel = "Bachelor's degree (in progress)";
      if (lowerText.includes('expected') || lowerText.includes('graduating')) {
        results.isStudent = true;
        results.isGraduated = false;
      }
    } else if (text.includes('High School')) {
      results.educationLevel = 'High school';
    }
    
    const isBulletPoint = (line) => {
      return line.startsWith('•') || line.startsWith('-') || line.startsWith('*') || line.match(/^[\u2022\u2023\u25E6\u2043\u2219]/);
    };
    
    const looksLikeRoleHeader = (line) => {
      if (isBulletPoint(line)) return false;
      if (line.length > 120) return false;
      
      const roleTitles = ['president', 'vice president', 'director', 'lead', 'manager', 'analyst', 'engineer', 'intern', 'coordinator', 'associate', 'specialist', 'officer', 'chair', 'member', 'founder', 'consultant', 'developer', 'designer'];
      
      const hasRoleTitle = roleTitles.some(title => line.toLowerCase().includes(title));
      const hasStructure = line.includes('|') || line.includes(' at ') || line.includes(' @ ') || /\d{4}/.test(line);
      
      return hasRoleTitle && (hasStructure || line.length < 60);
    };
    
    const currentYear = new Date().getFullYear();
    const currentIndicators = ['present', 'current', currentYear.toString()];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
      
      if (looksLikeRoleHeader(line)) {
        const combinedText = line + ' ' + nextLine;
        const hasCurrent = currentIndicators.some(indicator => combinedText.toLowerCase().includes(indicator.toLowerCase()));
        
        const isSummerIntern = /(summer|june|july|august)\s+\d{4}/i.test(combinedText) || (combinedText.toLowerCase().includes('intern') && /202[0-3]/.test(combinedText));
        
        if (hasCurrent && !isSummerIntern) {
          let roleTitle = line.split('|')[0].trim();
          roleTitle = roleTitle.split(' at ')[0].trim();
          roleTitle = roleTitle.split(',')[0].trim();
          
          results.currentRoles.push(roleTitle);
        }
        
        if ((line.toLowerCase().includes('club') || line.toLowerCase().includes('organization') || line.toLowerCase().includes('society')) && !line.toLowerCase().includes('intern')) {
          results.campusActivities.push(line);
          results.isStudent = true;
          results.isGraduated = false;
        }
      }
    }
    
    if (results.isStudent) {
      if (results.currentRoles.length > 0) {
        results.currentRole = results.currentRoles[0];
      } else if (results.campusActivities.length > 0) {
        results.currentRole = 'Student - Active in campus organizations';
      } else {
        results.currentRole = 'Student';
      }
    } else if (results.currentRoles.length > 0) {
      results.currentRole = results.currentRoles[0];
    }
    
    const pmKeywords = ['product', 'PM', 'case study', 'product manager', 'product lead', 'product thinking', 'product strategy', 'roadmap', 'backlog', 'sprint'];
    results.hasProductExperience = pmKeywords.some(keyword => lowerText.includes(keyword));
    
    results.hasMetrics = /\d+%|increased|grew|reduced|improved|achieved.*\d+/.test(text);
    results.hasLeadership = /(lead|led|leading|managed|directed|president|founder|chair)/i.test(text);
    
    return {
      ...results,
      skills: results.skills.length > 0 ? results.skills : ['Not detected - add specific skills to resume']
    };
  };

  const generateRoadmap = (parsed, userInputs) => {
    const gaps = [];
    const isStudent = !parsed.isGraduated;
    const { motivation, challenges, hoursPerWeek } = userInputs;
    
    // Determine user's experience level
    const userLevel = getUserLevel(parsed);

    // Personalized gaps based on what we ACTUALLY see in the resume
    if (!parsed.hasProductExperience) {
      gaps.push('No direct product management or product thinking experience mentioned');
    } else {
      // They have PM experience - acknowledge it but note areas to strengthen
      gaps.push(`You have PM-related experience (${parsed.currentRole}), but deepening product strategy and execution skills will strengthen your candidacy`);
    }
    
    if (!parsed.hasMetrics) {
      gaps.push('Resume lacks quantified impact metrics (percentages, numbers, results) - this is the #1 resume weakness');
    } else {
      gaps.push('You have some quantified metrics - consider adding more specific numbers to every bullet point');
    }
    
    if (!parsed.hasLeadership) {
      gaps.push('No clear leadership experience visible on resume');
    } else {
      gaps.push('You have leadership experience - make sure it\'s highlighted prominently');
    }
    
    // Technical skills gaps - be specific about what they DO have
    if (parsed.skills.length > 0) {
      const hasSQL = parsed.skills.includes('SQL');
      const hasPython = parsed.skills.includes('Python');
      const hasAnalytics = parsed.skills.includes('Analytics') || parsed.skills.includes('Data Analysis');
      
      if (!hasSQL) {
        gaps.push('Missing critical technical skill: SQL (essential for PM data literacy)');
      }
      if (!hasPython && !hasAnalytics) {
        gaps.push('Limited analytics capabilities - learning Python or advanced Excel/analytics would strengthen your profile');
      }
      
      // Acknowledge their existing skills
      if (parsed.skills.length >= 3) {
        gaps.push(`Your existing skills (${parsed.skills.slice(0, 3).join(', ')}) are a good foundation - focus on PM-specific skills like user research and product strategy`);
      }
    } else {
      gaps.push('Very few detectable skills on resume - add a clear "Skills" section with technical and soft skills');
    }
    
    if (!parsed.hasProductExperience && parsed.textLength < 2000) {
      gaps.push('Resume is too brief - add more detail about your impact, responsibilities, and accomplishments');
    }

    const missingTechnicalSkills = [];
    if (!parsed.skills.includes('SQL')) missingTechnicalSkills.push('SQL');
    if (!parsed.skills.includes('Python') && !parsed.skills.includes('Analytics') && !parsed.skills.includes('Data Analysis')) missingTechnicalSkills.push('Python/Analytics');
    if (!parsed.skills.includes('Excel') && !parsed.skills.includes('Tableau')) missingTechnicalSkills.push('Excel or Tableau');
    
    const missingPMSkills = [];
    if (!parsed.skills.includes('User Research') && !parsed.skills.includes('Research')) missingPMSkills.push('User Research');
    if (!parsed.skills.includes('A/B Testing')) missingPMSkills.push('A/B Testing');
    if (!parsed.skills.includes('Product Strategy')) missingPMSkills.push('Product Strategy');
    if (!parsed.skills.includes('Wireframing') && !parsed.skills.includes('Figma')) missingPMSkills.push('Wireframing/Design tools');

    let motivationAdvice = '';
    const motivationLower = motivation.toLowerCase();
    
    if (motivationLower.includes('problem') || motivationLower.includes('solving')) {
      motivationAdvice = "Since you love problem-solving, focus on case studies and frameworks in Phase 1. Practice breaking down ambiguous problems into structured solutions.";
    } else if (motivationLower.includes('build') || motivationLower.includes('product')) {
      motivationAdvice = "Your passion for building products is perfect for PM! Prioritize hands-on projects in Phase 2 to demonstrate your ability to ship.";
    } else if (motivationLower.includes('team') || motivationLower.includes('collaborat')) {
      motivationAdvice = "Your collaborative mindset is a PM superpower. Emphasize cross-functional projects and stakeholder management in your experience.";
    } else if (motivationLower.includes('impact') || motivationLower.includes('user')) {
      motivationAdvice = "Your user-focused mindset is essential for PM. Prioritize user research and metrics-driven thinking throughout your roadmap.";
    } else {
      motivationAdvice = "Your motivation will drive your success. Focus on building concrete PM experience that aligns with what excites you most.";
    }

    let challengeAdvice = '';
    const challengesLower = challenges.toLowerCase();
    
    if (challengesLower.includes('experience') || challengesLower.includes('enough')) {
      challengeAdvice = "Don't worry about lacking PM experience—most PMs transition from other roles. Focus on Phase 2 to create proof points of PM skills through projects and initiatives.";
    } else if (challengesLower.includes('interview') || challengesLower.includes('case')) {
      challengeAdvice = "Interview prep is crucial but learnable. Dedicate focused time in Phase 3 to mock interviews and case practice. Most candidates feel unprepared at first.";
    } else if (challengesLower.includes('technical') || challengesLower.includes('tech')) {
      challengeAdvice = "Technical skills can be learned! Start with SQL basics in Phase 1. You don't need to code like an engineer—just understand how products are built.";
    } else if (challengesLower.includes('network') || challengesLower.includes('connections')) {
      challengeAdvice = "Networking feels hard but gets easier. Start by reaching out to 2-3 PMs per week for informational interviews. Most people are happy to help!";
    } else if (challengesLower.includes('compete') || challengesLower.includes('competitive')) {
      challengeAdvice = "PM is competitive, but focusing on unique strengths and building proof points will differentiate you. Quality experience > quantity of applications.";
    } else {
      challengeAdvice = "Your concerns are valid and shared by many aspiring PMs. Focus on one phase at a time and track your progress. You'll build confidence through action.";
    }

    // Calculate total effort hours dynamically based on what actions they'll actually do
    const estimatedTotalHours = 125; // This will be calculated properly later
    const estimatedWeeks = Math.ceil(estimatedTotalHours / hoursPerWeek);
    const estimatedMonths = Math.ceil(estimatedWeeks / 4);
    
    let timelineNote = `At ${hoursPerWeek} hours/week, you'll complete this roadmap in approximately ${estimatedWeeks} weeks (${estimatedMonths} months).`;
    
    if (hoursPerWeek >= 20) {
      timelineNote += " ⚡ Lightning pace - you're all in!";
    } else if (hoursPerWeek >= 15) {
      timelineNote += " 🚀 Intensive pace - great for focused transitions!";
    } else if (hoursPerWeek >= 10) {
      timelineNote += " ✨ Balanced pace - sustainable while working/studying.";
    } else if (hoursPerWeek >= 7) {
      timelineNote += " 🎯 Steady pace - consistent progress without burnout.";
    } else {
      timelineNote += " 🌱 Relaxed pace - perfect for busy schedules.";
    }

    const phase1Actions = [
      {
        action: 'Watch "Product Management 101: A Quick Guide" on Leland',
        link: 'https://www.joinleland.com/content/course/urn:course:68c9492fdf84b203d53079e7/urn:contentEntry:68962dc18fe444e03d5a84a9',
        skills: ['Product strategy', 'PM fundamentals', 'Role understanding'],
        effortHours: adjustEffort(4, parsed, 'pm-fundamentals'),
        time: calculateTime(adjustEffort(4, parsed, 'pm-fundamentals'), hoursPerWeek),
        priority: !parsed.hasProductExperience ? 'HIGH' : 'MEDIUM',
        resourceType: 'Video Course',
        provider: 'Leland',
        why: 'Get a concise overview of what PMs actually do day-to-day and understand if this role aligns with your interests. This foundation helps you speak confidently about the PM role in interviews.',
        howTo: 'Watch the full course on Leland, take notes on key concepts like product discovery, roadmapping, and stakeholder management. Jot down questions to research further or discuss with PMs you know.',
        resumeImpact: 'Gives you foundational PM knowledge to speak confidently in interviews and networking conversations. You\'ll understand PM terminology and be able to discuss what PMs actually do day-to-day.',
        completionOutcome: 'After completing this step, you\'ll understand the core responsibilities of a PM, know the difference between product discovery and delivery, and be able to articulate why you want to be a PM.',
        howToTips: [
          '📝 Take notes on key concepts like product discovery, roadmapping, and stakeholder management',
          '❓ Jot down questions to research further or discuss with PMs you know',
          '🎯 After watching, write a 1-paragraph summary of what excites you most about PM',
          '💡 Pause and reflect: Can you identify PM skills you already use in your current role?'
        ],
        practicalSteps: [
          'Step 1: Block out 4 hours on your calendar for focused watching',
          'Step 2: Create a note document titled "PM Fundamentals - My Notes"',
          'Step 3: For each module, write down: Key concept, Real-world example, How I could apply this',
          'Step 4: After completion, identify 2-3 concepts to explore deeper via articles or LinkedIn posts'
        ]
      }
    ];

    // Skip PM 101 if they're already advanced
    if (userLevel.level === 'ADVANCED') {
      phase1Actions.shift(); // Remove first action
    }

    if (missingTechnicalSkills.includes('SQL')) {
      phase1Actions.push({
        action: 'PRIORITY: Learn SQL basics for data-driven product decisions',
        link: 'https://www.datacamp.com/courses/introduction-to-sql',
        skills: ['SQL basics', 'Data literacy', 'Query writing'],
        effortHours: adjustEffort(15, parsed, 'sql'),
        time: calculateTime(adjustEffort(15, parsed, 'sql'), hoursPerWeek),
        priority: 'HIGH',
        reason: 'SQL is missing from your resume - critical for PM data literacy',
        resourceType: 'Interactive Course',
        provider: 'DataCamp',
        why: 'PMs need to analyze data independently to make informed decisions. SQL allows you to query databases, understand user behavior, and validate hypotheses without always relying on data analysts.',
        howTo: 'Start with SELECT statements, learn JOIN operations, then practice with real datasets. Focus on understanding business questions you can answer with data.',
        resumeImpact: 'Add "SQL" to your technical skills section and demonstrate data literacy that PMs need to work with engineers and analysts. In interviews, you\'ll be able to discuss how you\'d query data to answer product questions.',
        completionOutcome: 'After completing this step, you\'ll be able to write basic SQL queries to analyze user data, calculate key metrics like retention and conversion rates, and speak confidently about data analysis in PM interviews.',
        howToTips: [
          '🎯 Focus on business questions: "How many users signed up last month?" not just syntax memorization',
          '💻 Practice with real datasets - download sample databases (Chinook DB for music, Northwind for e-commerce)',
          '📊 After learning each concept, try to answer a product question with it',
          '🔄 Review your notes weekly - SQL syntax is easy to forget without regular practice',
          '🏆 Challenge: By end of week 2, write 5 queries that answer real product questions',
          '💡 Connect to your domain: If you\'re in e-commerce, focus on transaction data; if social media, focus on user behavior'
        ],
        practicalSteps: [
          'Week 1: Master SELECT, WHERE, GROUP BY, ORDER BY - practice 30 min daily',
          'Week 1 Mini-Project: Query a sample e-commerce database to find top 10 products by revenue',
          'Week 2: Learn JOIN operations (INNER, LEFT, RIGHT) and aggregate functions (COUNT, SUM, AVG)',
          'Week 2 Mini-Project: Analyze user cohorts - who signed up when and their behavior patterns',
          'Final: Create a "SQL for PMs" cheat sheet with the 10 most useful queries for product analysis',
          'Bonus: Join the #sql channel on Product School Slack and ask questions'
        ],
        alternativeResources: [
          { name: 'SQL for Data Analysis (Udacity)', url: 'https://www.udacity.com/course/sql-for-data-analysis--ud198' },
          { name: 'SQL Essential Training (LinkedIn Learning)', url: 'https://www.linkedin.com/learning/sql-essential-training-3' },
          { name: 'Mode SQL Tutorial (Free)', url: 'https://mode.com/sql-tutorial/' }
        ]
      });
    } else {
      phase1Actions.push({
        action: 'You have SQL - Learn advanced data analysis and visualization',
        link: 'https://www.coursera.org/learn/data-analysis-with-python',
        skills: ['Advanced SQL', 'Data analysis', 'Python for data'],
        effortHours: 12,
        time: calculateTime(12, hoursPerWeek),
        priority: 'LOW',
        resourceType: 'Course',
        provider: 'Coursera',
        why: 'Since you already know SQL basics, level up with advanced queries, window functions, and data visualization to tell compelling product stories with data.',
        
        resumeImpact: 'Strengthen your technical skills section with "Advanced SQL (window functions, CTEs)" and "Python (Pandas, data analysis)"',
        completionOutcome: 'After completing this step, you\'ll be able to perform complex data analysis, create compelling visualizations, and present data-driven insights that influence product decisions.'
      });
    }

    if (missingTechnicalSkills.includes('Python/Analytics')) {
      phase1Actions.push({
        action: 'Build analytics skills with Python or Excel fundamentals',
        link: 'https://www.coursera.org/learn/python-data-analysis',
        skills: ['Analytics', 'Data interpretation', 'Python basics'],
        effortHours: adjustEffort(18, parsed, 'analytics'),
        time: calculateTime(adjustEffort(18, parsed, 'analytics'), hoursPerWeek),
        priority: 'MEDIUM',
        reason: 'Analytics skills help you understand metrics and make data-driven decisions',
        resourceType: 'Course',
        provider: 'Coursera',
        why: 'PMs constantly analyze metrics like conversion rates, retention, and engagement. Understanding how to manipulate and visualize data helps you identify trends and opportunities.',
        
        resumeImpact: 'Add "Python (Pandas, data analysis)" or "Excel (pivot tables, data analysis)" to skills section. More importantly, this enables you to independently analyze metrics and make data-driven product decisions.',
        completionOutcome: 'After completing this step, you\'ll be able to calculate and interpret key product metrics (conversion, retention, engagement), create dashboards, and use data to support your product recommendations.',
        howToTips: [
          '📊 Start with Excel if you\'re new to data - it\'s more accessible than Python',
          '🎯 Focus on metrics PMs actually use: conversion rate, retention, DAU/MAU, churn',
          '📈 Learn to create clear visualizations - a good chart tells the story',
          '🔢 Practice calculating these metrics yourself before using tools',
          '💡 Every analysis should answer: "So what? What action should we take?"'
        ],
        practicalSteps: [
          'Week 1: Learn data manipulation basics (filtering, sorting, grouping)',
          'Week 1 Exercise: Calculate conversion rate through a 5-step funnel',
          'Week 2: Learn visualization (charts, graphs, dashboards)',
          'Week 2 Exercise: Create a dashboard showing user engagement trends',
          'Week 3: Practice with a real dataset (Kaggle has good starter sets)',
          'Week 3 Project: Analyze an e-commerce dataset and present 3 insights'
        ],
        alternativeResources: [
          { name: 'Excel to MySQL (Coursera)', url: 'https://www.coursera.org/learn/excel-mysql' },
          { name: 'Data Analysis Essentials (LinkedIn Learning)', url: 'https://www.linkedin.com/learning/data-analysis-essentials' }
        ]
      });
    }

    phase1Actions.push({
      action: 'Study "How the Internet Works" and technical concepts for PMs on Leland',
        link: 'https://www.joinleland.com/content/course/urn:course:68cdbfae8401006b4d409a7c/urn:contentEntry:68c8e21c377d02b6b073d5b4',
      skills: ['Technical knowledge', 'System design', 'APIs', 'Networks'],
      effortHours: 5,
        time: calculateTime(5, hoursPerWeek),
      priority: 'HIGH',
      resourceType: 'Guide',
      provider: 'Leland',
      why: 'Even non-technical PMs need to communicate with engineers. Understanding how the internet works, APIs, databases, and system architecture helps you write better requirements, estimate timelines, and earn engineering team respect.',
      howTo: 'Read through the guide, then practice explaining concepts out loud as if teaching someone. Try diagramming a simple system (like Instagram) to test your understanding.',
      
      resumeImpact: 'Enables you to discuss technical concepts fluently in interviews and work effectively with engineering teams. You\'ll understand system design trade-offs and speak the same language as engineers.',
      completionOutcome: 'After completing this step, you\'ll be able to explain how web applications work, understand basic system architecture, and confidently discuss technical implementation with engineering teams.',
      howToTips: [
        '🎨 Draw diagrams as you learn - visual learning sticks better than just reading',
        '🗣️ Practice explaining concepts out loud as if teaching a friend',
        '🏗️ For each concept (APIs, databases, servers), find a real product example',
        '💡 Ask yourself: "How does Instagram use this?" to make concepts concrete',
        '📱 Trace a user action (e.g., posting a photo) through the full technical stack',
        '🤝 If you have engineer friends, ask them to explain their system architecture'
      ],
      practicalSteps: [
        'Day 1-2: Read the full Leland guide, highlight unfamiliar terms',
        'Day 3: Create a glossary of 10 key technical terms with simple definitions',
        'Day 4: Diagram a simple system (like Twitter) showing front-end, back-end, database, API',
        'Day 5: Practice explaining 3 concepts to a non-technical friend (test your understanding)',
        'Day 6-7: Read 2-3 engineering blog posts from tech companies to see concepts in action',
        'Bonus: Watch "System Design for Beginners" videos on YouTube'
      ]
    });

    phase1Actions.push({
      action: 'Analyze 3 products you use daily - document features, user flows, and business model',
      skills: ['Product analysis', 'Critical thinking', 'User flow mapping', 'Business strategy'],
      effortHours: 8,
      time: calculateTime(8, hoursPerWeek),
      
      resumeImpact: 'Add to portfolio as case studies and reference in interviews: "I analyzed Spotify\'s recommendation algorithm and identified 3 ways it drives retention" - demonstrates product thinking without needing work experience.',
      completionOutcome: 'After completing this step, you\'ll have 3 polished product analyses in your portfolio and be able to thoughtfully discuss product strategy, trade-offs, and business models in interviews.',
      priority: 'HIGH',
      resourceType: 'Self-guided practice',
      why: 'Product sense - the ability to think critically about why products work - is the #1 skill PMs need. Analyzing existing products trains you to spot patterns, understand trade-offs, and think like a PM.',
      howTo: `Pick 3 apps you use (e.g., Spotify, Uber, Instagram). For each, document:
      
1. Core Features: List 5-8 main features and why each exists
2. User Flows: Map out 2-3 key user journeys (screenshots help!)
3. Business Model: How does it make money? What are the metrics that matter?
4. Improvements: What would you change and why? What's the trade-off?
5. Competitive Landscape: Who are the competitors and what makes this product different?

Create a simple slide deck or Google Doc for each analysis. These become portfolio pieces you can reference in interviews when asked "tell me about a product you love."`,
      howToTips: [
        '📱 Pick products you use every single day - you know them deeply',
        '❓ Ask "why?" 5 times for each feature - dig into the underlying reasoning',
        '🎯 Focus on ONE user journey per product - go deep, not broad',
        '💰 Research the business model - read their earnings calls or tech crunch articles',
        '🆚 Compare to 2-3 competitors - what makes this product different?',
        '📊 Hypothesize metrics: What does "success" look like for this feature?',
        '🤔 Think about trade-offs: "They chose X over Y because..."'
      ],
      practicalSteps: [
        'Day 1: Pick 3 apps (recommend: 1 social, 1 productivity, 1 marketplace/e-commerce)',
        'Day 2: For Product 1, complete the full analysis template (see below)',
        'Day 3: For Product 2, complete the full analysis',
        'Day 4: For Product 3, complete the full analysis',
        'Day 5: Review all three, identify common patterns in good product design',
        'Day 6: Get feedback from a PM or mentor - share your analyses',
        'Day 7: Refine based on feedback, add to portfolio'
      ]
    });

    phase1Actions.push({
      action: 'Read "Inspired: How to Create Tech Products Customers Love" by Marty Cagan',
      link: 'https://www.amazon.com/INSPIRED-Create-Tech-Products-Customers/dp/1119387507',
      skills: ['Product mindset', 'User-centric thinking', 'Product discovery', 'Team dynamics'],
      effortHours: 15,
      time: calculateTime(15, hoursPerWeek),
      priority: 'MEDIUM',
      resourceType: 'Book',
      provider: 'Amazon',
      why: 'This is THE foundational PM book. It teaches you how great product teams work, how to discover what to build, and how to empower teams to solve customer problems. Every PM interview will reference concepts from this book.',
      howTo: `Reading guide:
      
Chapters 1-15: Core product management principles (focus here first)
Chapters 16-30: Product discovery techniques
Chapters 31-45: Product delivery and team dynamics

Take notes on:
- Key frameworks (e.g., opportunity assessment, customer discovery)
- Examples of good vs bad product management
- Questions you have about concepts

After reading, write a 1-page summary of the top 3 lessons and how you'd apply them. This becomes a talking point in interviews when asked about PM philosophy.`,
      howToTips: [
        '📖 Read 10-15 pages daily - consistency beats marathon sessions',
        '✏️ Take notes in your own words - don\'t just highlight',
        '🤔 After each chapter, ask: "How does this apply to my current/target role?"',
        '💬 Discuss concepts with a PM friend or in online communities',
        '🎯 Focus on Part I (Product Management) first - it\'s most foundational'
      ],
      practicalSteps: [
        'Week 1: Read Part I (Chapters 1-15) on product principles - 30 min/day',
        'Week 2: Read Part II (Chapters 16-30) on product discovery - 30 min/day',
        'Week 3: Read Part III (Chapters 31-45) on product delivery - 30 min/day',
        'Throughout: Maintain a "PM Concepts" document with definitions and examples',
        'End of Week 3: Write 1-page reflection on top learnings'
      ],
      studyGuide: {
        overview: 'This study guide breaks down Inspired into actionable lessons. Read 10-15 pages daily and complete the reflection questions to deepen your understanding of product management fundamentals.',
        chapters: [
          {
            section: 'Part I: Chapters 1-15 - Core PM Principles',
            timeframe: 'Week 1',
            keyTopics: [
              'The role of product management vs project management',
              'Product discovery vs product delivery',
              'Outcome-based roadmaps instead of feature roadmaps',
              'Empowered product teams and how they operate',
              'Product/Market Fit and why it matters'
            ],
            reflectionQuestions: [
              'How does your current team compare to an "empowered product team"?',
              'What\'s one change you could advocate for to move toward outcome-based planning?',
              'Identify a recent product decision - was it discovery-driven or delivery-driven?',
              'What does "fall in love with the problem, not the solution" mean to you?'
            ],
            actionItems: [
              'Write a 1-page memo: "What makes a great product team?" based on Chapters 1-15',
              'Identify 3 products you admire and hypothesize how they do product discovery',
              'Create a comparison table: Discovery mindset vs Delivery mindset',
              'List 3 ways your current role overlaps with PM responsibilities Cagan describes'
            ]
          },
          {
            section: 'Part II: Chapters 16-30 - Product Discovery',
            timeframe: 'Week 2',
            keyTopics: [
              'Customer interviews and user research techniques',
              'Rapid prototyping and testing assumptions',
              'Opportunity assessment framework',
              'Story mapping and user story slicing',
              'Validating ideas quickly with minimal resources'
            ],
            reflectionQuestions: [
              'Have you done customer discovery for any project? What did you learn?',
              'What\'s a product assumption you have that needs validation?',
              'How could you test an idea in 1 week with minimal resources?',
              'What\'s the difference between "Can we build it?" and "Should we build it?"'
            ],
            actionItems: [
              'Practice: Write an opportunity assessment for a product idea you have',
              'Conduct 3 "discovery interviews" with friends/colleagues about a problem space',
              'Create a simple prototype (even paper) for a small feature idea',
              'List 10 questions you\'d ask users to validate a product hypothesis'
            ]
          },
          {
            section: 'Part III: Chapters 31-45 - Product Delivery & Culture',
            timeframe: 'Week 3',
            keyTopics: [
              'Working effectively with engineering and design',
              'Product roadmaps and prioritization frameworks',
              'Stakeholder management and communication',
              'Building product culture and team dynamics',
              'Scaling product management in organizations'
            ],
            reflectionQuestions: [
              'How do you currently prioritize work? How could you improve using Cagan\'s frameworks?',
              'Who are the key stakeholders for products you work on? How do you manage relationships?',
              'What aspects of "product culture" resonate most with you and why?',
              'How would you handle a conflict between what users want and what engineering wants to build?'
            ],
            actionItems: [
              'Create a prioritization framework for your current projects using concepts from the book',
              'Map out stakeholders and their interests for a recent project or initiative',
              'Write your "PM philosophy" statement in 1 paragraph incorporating book concepts',
              'Identify one cultural change at your current company that would improve product outcomes'
            ]
          }
        ],
        finalProject: 'After finishing the book, create a 3-page summary document:\n\n1. **Top 10 Lessons Learned** - List the most impactful concepts with brief explanations\n2. **How I\'ll Apply These** - For each lesson, write 1-2 sentences on how you\'ll use it in your PM journey\n3. **Concepts to Explore Deeper** - Identify 5 topics you want to research further\n4. **My PM Philosophy** - Write a 1-paragraph statement on your product management approach informed by this book\n\nShare this summary with a PM mentor or in a PM community (like Leland) for feedback. Use it as a talking point in interviews when asked about your PM knowledge!'
      },
      
      resumeImpact: 'Equips you with foundational PM frameworks and vocabulary that will come up in every interview. You\'ll be able to discuss product discovery, empowered teams, and outcome-based thinking with confidence.',
      completionOutcome: 'After completing this step, you\'ll understand core PM principles like product discovery vs delivery, outcome-based planning, and customer-centric thinking. You\'ll speak the same language as experienced PMs in interviews.'
    });

    const basePhase1 = {
      title: 'Build Product Foundations',
      description: missingTechnicalSkills.length > 0 ? `Gain critical skills you're missing: ${missingTechnicalSkills.join(', ')}` : 'Strengthen your technical and strategic knowledge',
      motivationNote: motivationAdvice,
      actions: phase1Actions
    };

    const phase2 = {
      title: 'Build Product Credibility',
      description: 'Create concrete PM experience to put on your resume',
      challengeNote: challengeAdvice,
      actions: isStudent ? [
        {
          action: 'Join or start a Product Management club or case competition',
          skills: ['Case competition framework', 'Teamwork', 'Leadership', 'PM Network'],
          effortHours: 30,
          time: calculateTime(30, hoursPerWeek) + ' (ongoing)',
          priority: parsed.hasLeadership ? 'LOW' : 'HIGH',
          
          resumeImpact: 'Add as "VP of [University] PM Club" or "Member, Product Management Club" or "1st Place, [Competition Name] Case Competition" - shows PM commitment and provides leadership talking points.',
          completionOutcome: 'After completing this step, you\'ll have built a PM network, developed case solving skills, and can point to concrete leadership or involvement in PM community on your resume.',
          howToTips: [
            '🔍 Search "[Your University] product management club" on Google, LinkedIn, and your school\'s org directory',
            '🏆 Look for PM case competitions: PM National Competition, RookieUp, local hackathons',
            '🤝 If no club exists, start one! You only need 5-10 interested students',
            '📅 Commit to attending at least 2 events per month to build relationships',
            '💼 Leverage your career center to connect with PM alumni',
            '🎯 Don\'t just attend - volunteer to organize events or lead initiatives',
            '📱 Join the club\'s Slack/Discord and actively participate in discussions'
          ],
          practicalSteps: [
            'Week 1: Research - check your school\'s student org directory for existing PM clubs',
            'Week 1: Join Product Management Club groups on LinkedIn and Facebook',
            'Week 2: If club exists - attend first meeting, introduce yourself, volunteer for a role',
            'Week 2: If no club - recruit 4-5 passionate co-founders via class GroupMe/Slack',
            'Week 3: Sign up for upcoming PM case competition with a team (teams of 3-4)',
            'Ongoing: Attend events, practice cases weekly, network with guest speakers',
            'Month 2: Take on leadership role - event coordinator, case practice lead, etc.'
          ]
        },
        {
          action: 'Lead a student project: Pick a real problem and design a solution',
          skills: ['Problem-solving', 'User research', 'Metrics thinking', 'Leadership'],
          effortHours: 50,
          time: calculateTime(50, hoursPerWeek),
          
          resumeImpact: 'Add as "Product Lead - [Project Name]" with 2-3 quantified results. Example: "Led 3-person team to design campus dining app, achieving 85% positive feedback from 50 beta testers" - this becomes your strongest PM experience bullet.',
          completionOutcome: 'After completing this step, you\'ll have a full product case study for your portfolio, tangible evidence of PM skills, and can tell the story of leading a product from idea to launch in interviews.',
          priority: 'HIGH',
          howToTips: [
            '🎯 Pick a problem YOU personally experience - authenticity matters in your story',
            '👥 Recruit a small team (2-3 people max) with complementary skills (designer, developer, or analyst)',
            '📊 Focus on learning and measuring impact, not creating a perfect product',
            '📝 Document everything as you go - you\'ll need this for your resume and portfolio',
            '🗣️ Present your final project to PM club, class, or at a campus showcase',
            '💡 Start small and focused - better to solve 1 problem well than 5 problems poorly',
            '📈 Define success metrics BEFORE you start building anything'
          ],
          practicalSteps: [
            'Week 1: Identify problem space (e.g., "Campus dining wait times", "Study group coordination")',
            'Week 2: Conduct 10 user interviews with fellow students about the problem',
            'Week 3: Create 3 different solution concepts, get feedback on each from 5-10 students',
            'Week 4: Build a low-fidelity prototype (Figma mockups, paper prototypes, or simple landing page)',
            'Week 5-6: Test prototype with 15-20 users, iterate based on their feedback',
            'Week 7: Calculate your impact metrics (e.g., "Reduced coordination time by 40%")',
            'Week 8: Create final presentation and portfolio case study',
            'Bonus: Submit to product showcase or competition'
          ]
        },
        {
          action: 'Complete PM Case Study workshop on Leland',
          link: 'https://www.joinleland.com/library?categories=product-management',
          skills: ['Case thinking', 'Interview readiness', 'Structured problem-solving'],
          effortHours: 12,
          time: calculateTime(12, hoursPerWeek),
          priority: 'MEDIUM',
          
          resumeImpact: 'Prepares you to ace PM case interviews by mastering frameworks like CIRCLES, market sizing, and strategy cases. You\'ll be able to structure your thinking and communicate solutions clearly.',
          completionOutcome: 'After completing this step, you\'ll confidently solve product design, strategy, and analytical cases in interviews using structured frameworks, and think out loud effectively.',
          howToTips: [
            '🎯 Treat workshops like real interviews - time yourself strictly',
            '🗣️ Practice out loud - articulating your thinking is harder than thinking it',
            '📝 After each case, write self-critique: What went well? What would you improve?',
            '👥 Find a partner to practice with and give each other honest feedback',
            '🔄 Repeat cases you struggle with - repetition builds confidence and muscle memory',
            '📊 Learn frameworks (CIRCLES for product design, SWOT for strategy) but don\'t be robotic',
            '💭 Think out loud during practice - interviewers want to see your thought process'
          ],
          practicalSteps: [
            'Session 1: Watch workshop, learn case frameworks (market sizing, product design, strategy)',
            'Between sessions: Practice 1-2 cases daily for 15-20 minutes',
            'Session 2: Practice 3 product design cases with strict timing (30 min each)',
            'Session 3: Practice 2 strategy/business cases, get peer or coach feedback',
            'Session 4: Do full mock interview simulating real interview conditions',
            'After completion: Keep practicing 2-3 cases per week until interviews start'
          ]
        }
      ] : [
        {
          action: 'Propose & lead a product initiative at your current company',
          skills: ['Product ownership', 'Leadership', 'Cross-functional collaboration', 'Initiative'],
          effortHours: 60,
          time: calculateTime(60, hoursPerWeek),
          
          resumeImpact: 'Add new resume bullet: "Led cross-functional initiative reducing support tickets by 35%, impacting 500+ daily users" - shows you can drive PM work without the title.',
          completionOutcome: 'After completing this step, you\'ll have proven PM experience, a case study showing end-to-end product thinking, and concrete evidence of your ability to lead initiatives and deliver measurable results.',
          priority: 'HIGH',
          howToTips: [
            '🎯 Start small - pick something achievable in 8-12 weeks, not a year-long project',
            '💡 Look for pain points everyone complains about but nobody has time to fix',
            '📊 Pitch with data - "X% of users report this issue" or "We lose Y hours/week to this"',
            '🤝 Get a sponsor - find a manager/director who will champion your idea',
            '📈 Define success metrics upfront so you can prove impact on your resume',
            '🗓️ Start with a pilot or MVP - don\'t try to boil the ocean',
            '💬 Communicate progress weekly - keep stakeholders informed'
          ],
          practicalSteps: [
            'Week 1: Identify opportunity - what inefficiency, user pain, or gap exists?',
            'Week 2: Gather data - user surveys, interviews, analytics to quantify the problem',
            'Week 3: Draft 1-page proposal (see template in tips) with problem, solution, metrics',
            'Week 4: Present to manager and get buy-in + resources',
            'Week 5-10: Execute - assemble team, create timeline, ship incremental improvements',
            'Week 11-12: Measure results, gather testimonials, create case study',
            'Throughout: Document all decisions, learnings, and metrics for your portfolio'
          ]
        },
        {
          action: 'Conduct user interviews (10-15) for your initiative or a product feature',
          skills: ['User research', 'Empathy', 'Product insight', 'Interview techniques'],
          effortHours: 18,
          time: calculateTime(18, hoursPerWeek),
          priority: missingPMSkills.includes('User Research') ? 'HIGH' : 'MEDIUM',
          
          resumeImpact: 'Add to resume: "Conducted 15 user interviews uncovering 3 key pain points that informed product roadmap, improving satisfaction by 40%" - demonstrates core PM research capability.',
          completionOutcome: 'After completing this step, you\'ll know how to conduct effective user research, extract actionable insights from qualitative data, and use customer feedback to drive product decisions.',
          howToTips: [
            '🎯 Focus on understanding WHY users do things, not collecting feature requests',
            '👂 Listen 80%, talk 20% - let silence be your friend, people will fill it with insights',
            '📝 Take detailed notes but ALSO record (with permission) to catch nuances you miss',
            '❓ Use open-ended questions: "Tell me about..." not "Do you like..."',
            '🔍 Look for patterns across 5+ interviews before drawing conclusions',
            '💡 Ask about past behavior, not future hypotheticals - "Tell me about the last time..." is gold',
            '🚫 Don\'t pitch your solution during discovery - you\'ll bias their answers'
          ],
          practicalSteps: [
            'Step 1: Define research goal (e.g., "Understand pain points in [X] workflow")',
            'Step 2: Recruit 10-15 participants - mix of user types (power users, casual, churned)',
            'Step 3: Create interview guide with 8-10 open-ended questions (see template in tips)',
            'Step 4: Conduct interviews (30-45 min each), record with permission, take notes',
            'Step 5: After each interview, write down immediate observations',
            'Step 6: Synthesize all findings - look for themes, create affinity map, pull key quotes',
            'Step 7: Present insights to team with 3-5 key findings and recommendations',
            'Step 8: Document learnings in a portfolio case study'
          ]
        },
        {
          action: 'Complete PM Case Study workshop on Leland',
          link: 'https://www.joinleland.com/library?categories=product-management',
          skills: ['Case thinking', 'Communication', 'Structured problem-solving'],
          effortHours: 12,
          time: calculateTime(12, hoursPerWeek),
          priority: 'MEDIUM',
          
          resumeImpact: 'Prepares you to ace PM case interviews with frameworks for product design, strategy, and analytical problems. You\'ll structure ambiguous questions and communicate solutions clearly.',
          completionOutcome: 'After completing this step, you\'ll confidently tackle any PM case interview using frameworks like CIRCLES and market sizing, and articulate your thinking process effectively.',
          howToTips: [
            '🎯 Treat workshops like real interviews - time yourself strictly',
            '🗣️ Practice out loud - articulating your thinking is harder than thinking it',
            '📝 After each case, write self-critique: What went well? What would you improve?',
            '👥 Find a partner or coach to practice with and get honest feedback',
            '🔄 Repeat difficult cases - repetition builds confidence',
            '📊 Learn frameworks but adapt them - don\'t sound robotic',
            '💭 Think out loud - interviewers want to see your thought process'
          ],
          practicalSteps: [
            'Session 1: Learn case frameworks (CIRCLES, market sizing, strategy)',
            'Between: Practice 1-2 cases daily for 15-20 minutes',
            'Session 2: Practice 3 product design cases with timing',
            'Session 3: Practice strategy/analytical cases',
            'Session 4: Full mock interview simulation',
            'Ongoing: 2-3 cases per week until interview ready'
          ]
        }
      ]
    };

    const phase3 = {
      title: 'Polish & Activate',
      description: 'Prepare for PM internships or entry-level roles',
      timelineNote,
      actions: [
        {
          action: parsed.hasMetrics ? 'Enhance your resume with stronger metrics and impact' : 'PRIORITY: Rebuild resume with quantified metrics',
          link: 'https://www.joinleland.com/library?categories=resumes-cover-letters',
          skills: ['Resume optimization', 'Impact quantification', 'Storytelling'],
          effortHours: 10,
          time: calculateTime(10, hoursPerWeek),
          
          resumeImpact: 'Transform every bullet into results-driven statements that pass ATS screening and catch recruiter attention. A strong resume is your ticket to getting interviews.',
          completionOutcome: 'After completing this step, you\'ll have a polished, metrics-driven resume that clearly demonstrates PM skills and impact. You\'ll get past ATS systems and earn callbacks from recruiters.',
          priority: parsed.hasMetrics ? 'MEDIUM' : 'HIGH',
          reason: !parsed.hasMetrics ? 'Your resume lacks quantified impact metrics - this is the #1 resume mistake' : undefined,
          howToTips: [
            '📊 Every bullet should follow: [Action Verb] + [What you did] + [How you did it] + [Quantified Impact]',
            '💯 Use numbers even if estimated: "~200 users", "Improved by 30%", "Saved 5 hrs/week"',
            '🎯 Focus on outcomes, not activities: "Increased retention 15%" NOT "Sent emails to users"',
            '✂️ Cut buzzwords like "innovative", "passionate", "team player" - show, don\'t tell',
            '👀 Get 3 people to review your resume and give specific, actionable feedback',
            '🔢 If you can\'t quantify, describe scope: "Led 5-person team", "Managed $50K budget"',
            '⚡ Start bullets with strong verbs: Led, Built, Increased, Reduced, Designed, Analyzed'
          ],
          practicalSteps: [
            'Day 1: List all your experiences and extract every current bullet point',
            'Day 2: For each bullet, ask "So what? What was the actual impact?"',
            'Day 3: Transform bullets using formula: Action + What + How + Impact',
            'Day 4: Add metrics - estimate if needed ("~50% faster", "saved 5 hrs/week", "100+ users")',
            'Day 5: Cut to 1 page (2 pages if 5+ years experience), remove all fluff',
            'Day 6: Get feedback from 2-3 people (PM, recruiter friend, or Leland coach)',
            'Day 7: Final polish - check formatting, remove typos, export as PDF',
            'Bonus: Run through ATS checker tool to ensure it passes resume screening software'
          ]
        },
        {
          action: 'Create a PM portfolio website with 2-3 case studies',
          link: 'https://www.notion.so/templates/portfolio',
          skills: ['Portfolio building', 'Storytelling', 'Personal branding'],
          effortHours: 18,
          time: calculateTime(18, hoursPerWeek),
          priority: 'HIGH',
          
          resumeImpact: 'Add to resume header: "Portfolio: yourname.com" and reference in interviews: "As you can see in my portfolio case study on [X]..." - differentiates you from candidates with just resumes.',
          completionOutcome: 'After completing this step, you\'ll have a professional portfolio showcasing your product thinking, giving recruiters and hiring managers concrete examples of your PM skills beyond your resume.',
          howToTips: [
            '🎨 Use free tools: Notion (easiest), Webflow, Carrd, or Google Sites - don\'t overthink the platform',
            '📸 Include visuals - mockups, diagrams, data charts make it professional',
            '🔗 Make it easy to find - add link prominently to LinkedIn headline and resume header',
            '📱 Test on mobile - 40%+ of recruiters will view on phones',
            '🔄 Update quarterly with new projects and learnings',
            '💡 Quality over quantity - 2 great case studies beats 5 mediocre ones',
            '🎯 Tailor case studies to roles you want - applying to B2B SaaS? Show a B2B case study'
          ],
          practicalSteps: [
            'Week 1: Choose platform (recommend Notion for beginners) and set up basic structure',
            'Week 1: Write "About Me" - your PM story in 150 words, why PM excites you',
            'Week 2: Create Case Study #1 - your strongest project with full analysis',
            'Week 2: Create Case Study #2 - shows different skills (e.g., if #1 is technical, make #2 user research-focused)',
            'Week 3: Optional: Add Case Study #3, side project, or thought piece',
            'Week 3: Add contact section, LinkedIn link, resume download button',
            'Final: Share with 5 people for feedback, iterate based on comments',
            'Launch: Post on LinkedIn announcing your portfolio, ask your network to check it out'
          ]
        },
        {
          action: 'Complete 5 mock PM interviews with Leland coaches or peers',
          link: 'https://www.joinleland.com/coaching/product-management/interview-prep',
          skills: ['Interview skills', 'Communication', 'Product thinking', 'Confidence'],
          effortHours: 20,
          time: calculateTime(20, hoursPerWeek),
          priority: 'HIGH',
          
          resumeImpact: 'Directly improves your interview performance through practice and feedback. You\'ll be calm, structured, and confident when real interviews come.',
          completionOutcome: 'After completing this step, you\'ll walk into PM interviews with confidence, handle any case type (product design, strategy, metrics), and articulate your thinking clearly under pressure.',
          howToTips: [
            '📹 Record yourself practicing - watching back is uncomfortable but extremely valuable',
            '⏱️ Practice under real time pressure - most PM interviews have strict time limits',
            '🎯 Get specific feedback: Ask "What was unclear?" "Where did I lose you?" "What would you change?"',
            '🔄 Do the same case twice - once to learn, second time to improve',
            '📝 Keep a "feedback log" tracking patterns in what you need to work on',
            '💬 Practice the 2-minute "tell me about yourself" story until it\'s natural',
            '🧠 Focus on thinking out loud - interviewers care more about HOW you think than the final answer'
          ],
          practicalSteps: [
            'Interview 1 (Week 1): Product design case - get baseline feedback',
            'Interview 2 (Week 2): Strategy/business case',
            'Interview 3 (Week 2): Metrics/analytical case',
            'Interview 4 (Week 3): Behavioral questions + leadership scenarios',
            'Interview 5 (Week 4): Full interview loop simulation combining all types',
            'Between each: Practice specific weak areas for 30 min daily',
            'After all 5: Review all feedback, identify top 3 patterns, create action plan'
          ]
        },
        {
          action: 'Apply to 30-50 PM roles with tailored applications and network strategically',
          skills: ['Job search strategy', 'Networking', 'Personal branding', 'Persistence'],
          effortHours: 40,
          time: calculateTime(40, hoursPerWeek) + ' (ongoing)',
          priority: 'HIGH',
          
          resumeImpact: 'Maximizes your chances of landing interviews through strategic applications and networking. Referrals dramatically increase callback rates compared to cold applications.',
          completionOutcome: 'After completing this step, you\'ll have a full application pipeline, meaningful connections with PMs at target companies, and multiple interview opportunities to convert your preparation into offers.',
          howToTips: [
            '🎯 Quality over quantity - 1 tailored application beats 10 spray-and-pray',
            '🔗 Find referrals on LinkedIn - internal referrals increase callback rates 5-10x',
            '📊 Track everything in spreadsheet: company, date, status, contacts, next steps',
            '📧 Follow up 1 week after applying with a personalized message to recruiter',
            '🤝 Attend PM events, meetups, and webinars to build relationships (not just apply online)',
            '💬 Message template: "Hi [Name], I applied for PM role at [Company]. Love your [specific product]. Could we chat 15 min about your experience?"',
            '🎨 Customize your resume for EACH application - highlight relevant experience',
            '📈 Apply in batches - 10-15 per week is sustainable while working/studying'
          ],
          practicalSteps: [
            'Week 1: Build target company list (30-50 companies across 3 tiers: reach, fit, backup)',
            'Week 1: Research each company - read about products, values, recent news',
            'Week 2-3: Apply to 10-15 per week with customized resumes and cover letters where needed',
            'Week 2-3: For each application, find 1-2 employees on LinkedIn, send connection requests with personalized notes',
            'Week 4-6: Follow up on applications, continue applying, prepare for interviews as they come',
            'Week 4-6: Request informational interviews with PMs at target companies',
            'Throughout: Document learnings, update resume based on feedback, refine your pitch',
            'Networking: Attend 1-2 PM events or webinars per week, post about your PM journey on LinkedIn'
          ]
        }
      ]
    };

    // Build existing strengths list with context
    const existingStrengths = [];
    if (parsed.skills.length > 0) {
      existingStrengths.push(...parsed.skills.slice(0, 5));
    }
    if (parsed.hasMetrics) {
      existingStrengths.push('Quantified impact on resume');
    }
    if (parsed.hasLeadership) {
      existingStrengths.push('Leadership experience');
    }
    if (parsed.hasProductExperience) {
      existingStrengths.push('Product-related experience');
    }

    return {
      userLevel,
      gaps: gaps.length > 0 ? gaps : ['Your resume is strong! Focus on deepening product experience.'],
      missingSkills: [...missingTechnicalSkills, ...missingPMSkills],
      existingStrengths: existingStrengths.length > 0 ? existingStrengths : ['Ready to build new PM skills!'],
      phase1: basePhase1,
      phase2,
      phase3,
      timelineNote
    };
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setSelectedFile(file);
  };

  const handleParseResume = async () => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }

    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        let text = '';

        if (selectedFile.type === 'application/pdf' || selectedFile.name.endsWith('.pdf')) {
          try {
            const typedArray = new Uint8Array(event.target.result);
            
            const pdfjsLib = window['pdfjs-dist/build/pdf'];
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            
            const pdf = await pdfjsLib.getDocument(typedArray).promise;
            
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const content = await page.getTextContent();
              const pageText = content.items.map(item => item.str).join(' ');
              text += pageText + '\n';
            }
          } catch (pdfError) {
            console.error('PDF parsing error:', pdfError);
            alert('Error parsing PDF. Please try converting to .docx or .txt format.');
            return;
          }
        } else if (selectedFile.name.endsWith('.docx') || selectedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          const arrayBuffer = event.target.result;
          const result = await mammoth.extractRawText({ arrayBuffer });
          text = result.value;
        } else if (selectedFile.type === 'text/plain' || selectedFile.name.endsWith('.txt')) {
          text = event.target.result;
        } else {
          alert('Please upload a .pdf, .docx or .txt file');
          return;
        }

        if (!text || text.trim().length === 0) {
          alert('File appears to be empty. Please try another file.');
          return;
        }

        console.log('Extracted text length:', text.length);
        console.log('First 500 characters:', text.substring(0, 500));

        setResumeText(text);
        const parsed = parseResume(text);
        console.log('Parsed data:', parsed);
        setExtractedData(parsed);
      } catch (error) {
        console.error('Error reading file:', error);
        alert('Error reading file: ' + error.message);
      }
    };

    reader.onerror = () => {
      alert('Error reading file');
    };

    if (selectedFile.type === 'text/plain' || selectedFile.name.endsWith('.txt')) {
      reader.readAsText(selectedFile);
    } else {
      reader.readAsArrayBuffer(selectedFile);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleContinue = () => {
    if (currentStep === 1 && resumeText && formData.motivation && formData.challenges) {
      setIsAnalyzing(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        setIsAnalyzing(false);
        setCurrentStep(2);
        setTimeout(() => {
          setCurrentStep(3);
          setTimeout(() => {
            const roadmapSection = document.getElementById('roadmap-section');
            if (roadmapSection) {
              roadmapSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 300);
        }, 2000);
      }, 3000);
    }
  };

  const handleExportRoadmap = () => {
    if (!roadmap) return;
    
    // Create HTML content for PDF
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>PM Roadmap</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
          h1 { color: #15B078; border-bottom: 3px solid #15B078; padding-bottom: 10px; }
          h2 { color: #15B078; margin-top: 30px; }
          h3 { color: #333; margin-top: 20px; }
          .header-info { background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .timeline-box { background: #C4EBDD; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .gap-section { background: #FFFAF0; border-left: 4px solid #15B078; padding: 15px; margin: 20px 0; }
          .skills-box { background: #FEE2E2; padding: 10px; border-radius: 5px; margin: 10px 0; }
          .strengths-box { background: #D1FAE5; padding: 10px; border-radius: 5px; margin: 10px 0; }
          .phase { border: 2px solid #15B078; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .phase-number { display: inline-block; background: #15B078; color: white; width: 40px; height: 40px; border-radius: 50%; text-align: center; line-height: 40px; font-size: 20px; font-weight: bold; margin-right: 10px; }
          .action { background: #f8f8f8; padding: 15px; margin: 10px 0; border-radius: 5px; }
          .priority-high { background: #FEE2E2; color: #B91C1C; padding: 3px 8px; border-radius: 3px; font-size: 11px; font-weight: bold; }
          .advice-box { background: #E6F7F1; padding: 12px; border-radius: 5px; margin: 10px 0; }
          ul { list-style-type: none; padding-left: 0; }
          li { margin: 8px 0; padding-left: 20px; position: relative; }
          li:before { content: "→"; position: absolute; left: 0; color: #15B078; font-weight: bold; }
          .meta { color: #666; font-size: 14px; }
          .link { color: #15B078; text-decoration: none; }
        </style>
      </head>
      <body>
        <h1>🎯 Your Personalized PM Roadmap</h1>
        
        <div class="header-info">
          <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Timeline Goal:</strong> ${formData.timeline === '3months' ? '3 months' : formData.timeline === '6months' ? '6 months' : formData.timeline === '1year' ? '1 year' : '2+ years'}</p>
          <p><strong>Commitment:</strong> ${formData.hoursPerWeek} hours per week</p>
        </div>
        
        ${timelineEstimate ? `
        <div class="timeline-box">
          <h3>📅 Your Estimated Timeline</h3>
          <p><strong>${timelineEstimate.totalMonths} months</strong> (${timelineEstimate.totalWeeks} weeks, ${timelineEstimate.totalHours} total hours)</p>
        </div>
        ` : ''}
        
        <div class="gap-section">
          <h2>⚠️ What's Missing From Your Resume</h2>
          <ul>
            ${roadmap.gaps.map(gap => `<li>${gap}</li>`).join('')}
          </ul>
          
          ${roadmap.missingSkills && roadmap.missingSkills.length > 0 ? `
          <div class="skills-box">
            <p><strong>🎯 Critical Skills to Develop:</strong></p>
            <p>${roadmap.missingSkills.join(', ')}</p>
          </div>
          ` : ''}
          
          ${roadmap.existingStrengths && roadmap.existingStrengths.length > 0 ? `
          <div class="strengths-box">
            <p><strong>✓ Your Existing Strengths:</strong></p>
            <p>${roadmap.existingStrengths.join(', ')}</p>
          </div>
          ` : ''}
        </div>
        
        ${[roadmap.phase1, roadmap.phase2, roadmap.phase3].map((phase, idx) => `
        <div class="phase">
          <h2><span class="phase-number">${idx + 1}</span>${phase.title}</h2>
          <p class="meta">${phase.description}</p>
          
          ${phase.motivationNote ? `
          <div class="advice-box">
            <p><strong>💡 Based on your motivation:</strong></p>
            <p>${phase.motivationNote}</p>
          </div>
          ` : ''}
          
          ${phase.challengeNote ? `
          <div class="advice-box">
            <p><strong>🎯 Addressing your concern:</strong></p>
            <p>${phase.challengeNote}</p>
          </div>
          ` : ''}
          
          ${phase.actions.map((action, actionIdx) => `
          <div class="action">
            <p><strong>${actionIdx + 1}. ${action.action}</strong> ${action.priority === 'HIGH' ? '<span class="priority-high">HIGH PRIORITY</span>' : ''}</p>
            ${action.reason ? `<p class="meta" style="color: #B91C1C; font-style: italic;">Why: ${action.reason}</p>` : ''}
            <p class="meta"><strong>Skills:</strong> ${action.skills.join(', ')}</p>
            <p class="meta"><strong>Time:</strong> ${action.time}</p>
            ${action.link ? `<p class="meta"><strong>Resource:</strong> <a href="${action.link}" class="link">${action.link}</a></p>` : ''}
            ${action.resumeImpact ? `<p class="meta" style="background: #E6F7F1; padding: 8px; border-radius: 4px; margin-top: 8px;"><strong>📝 Resume Impact:</strong> ${action.resumeImpact}</p>` : ''}
          </div>
          `).join('')}
        </div>
        `).join('')}
        
        <div style="margin-top: 40px; padding: 20px; background: #C4EBDD; border-radius: 8px; text-align: center;">
          <p style="font-size: 18px; margin: 0;"><strong>🎉 Your personalized roadmap is ready!</strong></p>
          <p style="margin: 10px 0 0 0;">Start with Phase 1 and track your progress. Consider reviewing with a Leland coach for personalized feedback.</p>
        </div>
      </body>
      </html>
    `;
    
    // Create a new window and print to PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Wait for content to load then trigger print dialog
      printWindow.onload = () => {
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 250);
      };
    }
  };

  const calculateTimeline = () => {
    if (!roadmap) return null;
    
    const hoursPerWeek = formData.hoursPerWeek || 10;
    
    // Carefully estimate total hours needed for all phases
    let totalHours = 0;
    
    [roadmap.phase1, roadmap.phase2, roadmap.phase3].forEach(phase => {
      phase.actions.forEach(action => {
        const timeStr = action.time.toLowerCase();
        
        if (timeStr.includes('week') && !timeStr.includes('month')) {
          // Parse things like "4 weeks" or "2 weeks, 3-5 hrs/week"
          const weeksMatch = timeStr.match(/(\d+)-?(\d+)?\s*weeks?/);
          const weeks = weeksMatch ? parseInt(weeksMatch[1]) : 4;
          
          const hoursMatch = timeStr.match(/(\d+)-(\d+)\s*hrs?\/\s*week/);
          if (hoursMatch) {
            // Specific hours per week mentioned
            const avgHoursPerWeek = (parseInt(hoursMatch[1]) + parseInt(hoursMatch[2])) / 2;
            totalHours += weeks * avgHoursPerWeek;
          } else {
            // No specific hours, assume moderate effort based on task
            totalHours += weeks * 5; // assume 5 hrs/week for general tasks
          }
        } else if (timeStr.includes('month')) {
          // Parse things like "2-3 months"
          const monthsMatch = timeStr.match(/(\d+)-?(\d+)?\s*months?/);
          const months = monthsMatch ? parseInt(monthsMatch[1]) : 2;
          // Assume 5 hours per week for month-long projects
          totalHours += months * 4 * 5; // 4 weeks per month, 5 hrs/week
        } else if (timeStr.includes('session')) {
          // Parse things like "2 sessions" or "3 sessions over 3 weeks"
          const sessionsMatch = timeStr.match(/(\d+)\s*sessions?/);
          const sessions = sessionsMatch ? parseInt(sessionsMatch[1]) : 1;
          totalHours += sessions * 2; // 2 hours per session
        } else if (timeStr.includes('ongoing')) {
          // Ongoing activities - estimate conservatively
          totalHours += 30; // 30 hours total for ongoing activities
        } else {
          // Default fallback
          totalHours += 10;
        }
      });
    });
    
    // Calculate realistic timeline based on user's hours per week
    const totalWeeksNeeded = Math.ceil(totalHours / hoursPerWeek);
    const calculatedMonths = Math.ceil(totalWeeksNeeded / 4);
    
    // Generate smart feedback
    let timelineFeedback = `At ${hoursPerWeek} hrs/week, you'll complete this in ${totalWeeksNeeded} weeks (${calculatedMonths} months).`;
    
    if (hoursPerWeek >= 20) {
      timelineFeedback += " ⚡ Super fast pace!";
    } else if (hoursPerWeek >= 15) {
      timelineFeedback += " 🚀 Intensive but achievable!";
    } else if (hoursPerWeek >= 10) {
      timelineFeedback += " ✨ Balanced and sustainable!";
    } else {
      timelineFeedback += " 🌱 Steady progress!";
    }
    
    return {
      totalHours: Math.round(totalHours),
      totalWeeks: totalWeeksNeeded,
      totalMonths: calculatedMonths,
      hoursPerWeek,
      timelineFeedback
    };
  };

  const isFormComplete = () => {
    return resumeText && formData.motivation && formData.challenges;
  };

  const roadmap = extractedData ? (customRoadmap || generateRoadmap(extractedData, formData)) : null;
  const timelineEstimate = roadmap ? calculateTimeline() : null;
  const progress = roadmap && Object.keys(completedActions).length > 0 ? calculateProgress() : null;

  // Initialize custom roadmap when first generated
  React.useEffect(() => {
    if (roadmap && !customRoadmap && currentStep >= 3) {
      setCustomRoadmap(roadmap);
    }
  }, [roadmap, currentStep]);

  // Check for phase completion and trigger celebration
  React.useEffect(() => {
    if (!roadmap) return;

    const checkPhaseCompletion = (phaseIdx, phaseActions) => {
      const phaseActionKeys = [];
      for (let i = 0; i < phaseActions.length; i++) {
        phaseActionKeys.push(`${phaseIdx}-${i}`);
      }
      return phaseActionKeys.every(key => completedActions[key]);
    };

    // Check each phase
    const phase1Complete = checkPhaseCompletion(0, roadmap.phase1.actions);
    const phase2Complete = checkPhaseCompletion(1, roadmap.phase2.actions);
    const phase3Complete = checkPhaseCompletion(2, roadmap.phase3.actions);

    // Show celebration for newly completed phases
    if (phase1Complete && !celebratedPhases.phase1) {
      setShowCelebration('phase1');
      setCelebratedPhases(prev => ({ ...prev, phase1: true }));
    } else if (phase2Complete && !celebratedPhases.phase2) {
      setShowCelebration('phase2');
      setCelebratedPhases(prev => ({ ...prev, phase2: true }));
    } else if (phase3Complete && !celebratedPhases.phase3) {
      setShowCelebration('phase3');
      setCelebratedPhases(prev => ({ ...prev, phase3: true }));
    }
  }, [completedActions, roadmap, celebratedPhases]);

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b shadow-sm" style={{ borderColor: 'rgba(229, 229, 229, 1)', backgroundColor: 'white' }}>
        <div className="max-w-4xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold" style={{ color: 'rgba(51, 51, 51, 1)' }}>
            CareerPath AI
          </h1>
          <p className="mt-2" style={{ color: 'rgba(112, 112, 112, 1)' }}>
            Your personalized PM roadmap based on your actual resume
          </p>
          
          {extractedData && (
            <div className="mt-4 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep >= 1 ? 'text-white' : 'text-gray-400'}`} style={{ backgroundColor: currentStep >= 1 ? 'rgba(21, 176, 120, 1)' : 'rgba(229, 229, 229, 1)' }}>
                  1
                </div>
                <span className="text-sm font-medium" style={{ color: currentStep >= 1 ? 'rgba(21, 176, 120, 1)' : 'rgba(112, 112, 112, 1)' }}>Upload</span>
              </div>
              <div className="h-0.5 w-12" style={{ backgroundColor: currentStep >= 2 ? 'rgba(21, 176, 120, 1)' : 'rgba(229, 229, 229, 1)' }}></div>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep >= 2 ? 'text-white' : 'text-gray-400'}`} style={{ backgroundColor: currentStep >= 2 ? 'rgba(21, 176, 120, 1)' : 'rgba(229, 229, 229, 1)' }}>
                  2
                </div>
                <span className="text-sm font-medium" style={{ color: currentStep >= 2 ? 'rgba(21, 176, 120, 1)' : 'rgba(112, 112, 112, 1)' }}>Analyze</span>
              </div>
              <div className="h-0.5 w-12" style={{ backgroundColor: currentStep >= 3 ? 'rgba(21, 176, 120, 1)' : 'rgba(229, 229, 229, 1)' }}></div>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${currentStep >= 3 ? 'text-white' : 'text-gray-400'}`} style={{ backgroundColor: currentStep >= 3 ? 'rgba(21, 176, 120, 1)' : 'rgba(229, 229, 229, 1)' }}>
                  3
                </div>
                <span className="text-sm font-medium" style={{ color: currentStep >= 3 ? 'rgba(21, 176, 120, 1)' : 'rgba(112, 112, 112, 1)' }}>Roadmap</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {currentStep >= 1 && (
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'rgba(51, 51, 51, 1)' }}>
              Step 1: Upload Your Resume
            </h2>
            <p style={{ color: 'rgba(112, 112, 112, 1)' }}>
              We'll analyze your resume and create a personalized roadmap to PM
            </p>
          </div>

          <div className="mb-8">
            <label className="block mb-3 font-medium" style={{ color: 'rgba(51, 51, 51, 1)' }}>
              Upload Your Resume
            </label>
            <div 
              className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:bg-gray-50 transition-colors"
              style={{ borderColor: 'rgba(229, 229, 229, 1)' }}
            >
              <input 
                type="file" 
                accept=".docx,.txt,.pdf" 
                onChange={handleFileSelect}
                className="hidden"
                id="resume-upload"
              />
              <label htmlFor="resume-upload" className="cursor-pointer">
                <Upload className="mx-auto mb-4" size={48} style={{ color: 'rgba(21, 176, 120, 1)' }} />
                <p className="font-medium mb-1" style={{ color: 'rgba(51, 51, 51, 1)' }}>
                  {fileName || 'Click to select your resume'}
                </p>
                <p className="text-sm" style={{ color: 'rgba(112, 112, 112, 1)' }}>
                  .pdf, .docx or .txt files
                </p>
              </label>
            </div>

            {fileName && !extractedData && (
              <button
                onClick={handleParseResume}
                className="mt-4 w-full px-8 py-4 rounded-lg font-semibold text-white transition-colors"
                style={{ backgroundColor: 'rgba(21, 176, 120, 1)' }}
              >
                Parse & Analyze Resume
              </button>
            )}
          </div>

          {extractedData && (
            <>
              <div className="mb-8 p-6 rounded-lg" style={{ backgroundColor: 'rgba(196, 235, 221, 0.2)' }}>
                <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: 'rgba(51, 51, 51, 1)' }}>
                  <FileText size={20} />
                  What We Found In Your Resume
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium mb-1" style={{ color: 'rgba(112, 112, 112, 1)' }}>Most Recent Role</p>
                    <p style={{ color: 'rgba(51, 51, 51, 1)' }}>{extractedData.currentRole}</p>
                  </div>
                  <div>
                    <p className="font-medium mb-1" style={{ color: 'rgba(112, 112, 112, 1)' }}>Status</p>
                    <p style={{ color: 'rgba(51, 51, 51, 1)' }}>{extractedData.isGraduated ? 'Graduated' : 'Student'}</p>
                  </div>
                  <div>
                    <p className="font-medium mb-1" style={{ color: 'rgba(112, 112, 112, 1)' }}>Skills Detected</p>
                    <p style={{ color: 'rgba(51, 51, 51, 1)' }}>{extractedData.skills.slice(0, 3).join(', ')}</p>
                  </div>
                  <div>
                    <p className="font-medium mb-1" style={{ color: 'rgba(112, 112, 112, 1)' }}>Product Experience</p>
                    <p style={{ color: 'rgba(51, 51, 51, 1)' }}>{extractedData.hasProductExperience ? 'Yes' : 'Not detected'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6 mb-8">
                <div>
                  <label className="block mb-2 font-medium" style={{ color: 'rgba(51, 51, 51, 1)' }}>
                    What's your main motivation for becoming a PM? <span style={{ color: 'rgba(239, 68, 68, 1)' }}>*</span>
                  </label>
                  <textarea
                    value={formData.motivation}
                    onChange={(e) => handleInputChange('motivation', e.target.value)}
                    placeholder="e.g., I love solving problems, building products, collaborating with teams..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2"
                    style={{ borderColor: 'rgba(229, 229, 229, 1)' }}
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium" style={{ color: 'rgba(51, 51, 51, 1)' }}>
                    What's your biggest concern about the transition? <span style={{ color: 'rgba(239, 68, 68, 1)' }}>*</span>
                  </label>
                  <textarea
                    value={formData.challenges}
                    onChange={(e) => handleInputChange('challenges', e.target.value)}
                    placeholder="e.g., Not sure I have enough experience, worried about interviews..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2"
                    style={{ borderColor: 'rgba(229, 229, 229, 1)' }}
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium" style={{ color: 'rgba(51, 51, 51, 1)' }}>
                    How many hours per week can you dedicate to this? <span style={{ color: 'rgba(239, 68, 68, 1)' }}>*</span>
                  </label>
                  <input
                    type="range"
                    min="3"
                    max="40"
                    value={formData.hoursPerWeek}
                    onChange={(e) => handleInputChange('hoursPerWeek', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm mt-1" style={{ color: 'rgba(112, 112, 112, 1)' }}>
                    <span>3 hrs</span>
                    <span className="font-bold text-xl" style={{ color: 'rgba(21, 176, 120, 1)' }}>{formData.hoursPerWeek} hrs/week</span>
                    <span>40 hrs</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleContinue}
                disabled={!isFormComplete()}
                className="w-full px-8 py-4 rounded-lg font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: 'rgba(21, 176, 120, 1)' }}
              >
                Generate My PM Roadmap
              </button>
              {!isFormComplete() && (
                <p className="mt-3 text-sm text-center" style={{ color: 'rgba(112, 112, 112, 1)' }}>
                  Please complete all required fields to continue
                </p>
              )}
            </>
          )}
        </div>
      )}

      {(isAnalyzing || currentStep >= 2) && extractedData && (
        <div className="py-16" style={{ backgroundColor: 'rgba(196, 235, 221, 1)' }}>
          <div className="max-w-4xl mx-auto px-6 text-center">
            {isAnalyzing ? (
              <>
                <Loader className="mx-auto mb-6 animate-spin" size={48} style={{ color: 'rgba(21, 176, 120, 1)' }} />
                <h2 className="text-2xl font-bold mb-4" style={{ color: 'rgba(51, 51, 51, 1)' }}>
                  Analyzing your profile...
                </h2>
                <div className="space-y-2 max-w-md mx-auto" style={{ color: 'rgba(112, 112, 112, 1)' }}>
                  <p>Extracting resume insights...</p>
                  <p>Identifying PM skill gaps...</p>
                  <p>Building your personalized roadmap...</p>
                </div>
              </>
            ) : (
              <>
                <CheckCircle className="inline-block mb-4" size={64} style={{ color: 'rgba(21, 176, 120, 1)' }} />
                <h2 className="text-2xl font-bold" style={{ color: 'rgba(51, 51, 51, 1)' }}>
                  Analysis Complete!
                </h2>
              </>
            )}
          </div>
        </div>
      )}

      {currentStep >= 3 && roadmap && (
        <div id="roadmap-section" className="max-w-4xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3" style={{ color: 'rgba(51, 51, 51, 1)' }}>
              Your Personalized PM Roadmap
            </h2>
            
            {/* User Level Badge */}
            {roadmap.userLevel && (
              <div className="flex justify-center mb-3">
                <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full font-bold text-white shadow-md text-sm" 
                     style={{ 
                       backgroundColor: roadmap.userLevel.level === 'ADVANCED' ? 'rgba(147, 51, 234, 1)' : 
                                       roadmap.userLevel.level === 'INTERMEDIATE' ? 'rgba(59, 130, 246, 1)' : 
                                       'rgba(234, 179, 8, 1)'
                     }}>
                  <span className="text-lg">{roadmap.userLevel.badge}</span>
                  <span>{roadmap.userLevel.level}</span>
                </div>
              </div>
            )}
            
            <p className="text-lg" style={{ color: 'rgba(112, 112, 112, 1)' }}>
              Based on your background and goals
            </p>
            
            {/* Edit Mode Toggle */}
            <div className="mt-4 flex items-center justify-center gap-4">
              <button
                onClick={() => setEditMode(!editMode)}
                className="px-6 py-2 rounded-lg font-medium transition-all"
                style={{ 
                  backgroundColor: editMode ? 'rgba(21, 176, 120, 1)' : 'white',
                  color: editMode ? 'white' : 'rgba(21, 176, 120, 1)',
                  border: '2px solid rgba(21, 176, 120, 1)'
                }}
              >
                {editMode ? '✓ Done Editing' : '✏️ Customize Roadmap'}
              </button>
            </div>
          </div>

          {/* Progress Tracker */}
          {progress && (
            <div className="mb-8 p-6 rounded-lg shadow-lg" style={{ backgroundColor: 'rgba(21, 176, 120, 0.05)', border: '2px solid rgba(21, 176, 120, 1)' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg" style={{ color: 'rgba(51, 51, 51, 1)' }}>📊 Your Progress</h3>
                  <p className="text-sm" style={{ color: 'rgba(112, 112, 112, 1)' }}>
                    {progress.completed} of {progress.total} actions completed
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold" style={{ color: 'rgba(21, 176, 120, 1)' }}>
                    {progress.percentage}%
                  </p>
                </div>
              </div>
              <div className="w-full h-4 rounded-full" style={{ backgroundColor: 'rgba(229, 229, 229, 1)' }}>
                <div 
                  className="h-4 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${progress.percentage}%`,
                    backgroundColor: 'rgba(21, 176, 120, 1)'
                  }}
                ></div>
              </div>
            </div>
          )}

          {/* Target Timeline Box - Shows AFTER roadmap generation */}
          <div className="mb-8 p-6 rounded-lg shadow-lg" style={{ backgroundColor: 'rgba(196, 235, 221, 0.2)', border: '2px solid rgba(21, 176, 120, 1)' }}>
            <h3 className="font-bold text-xl mb-4" style={{ color: 'rgba(51, 51, 51, 1)' }}>🎯 Your Target Timeline</h3>
            
            {/* Editable slider */}
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium" style={{ color: 'rgba(51, 51, 51, 1)' }}>
                Adjust your weekly time commitment:
              </label>
              <input
                type="range"
                min="3"
                max="40"
                value={formData.hoursPerWeek}
                onChange={(e) => handleInputChange('hoursPerWeek', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-sm mt-1" style={{ color: 'rgba(112, 112, 112, 1)' }}>
                <span>3 hrs</span>
                <span className="font-bold text-xl" style={{ color: 'rgba(21, 176, 120, 1)' }}>{formData.hoursPerWeek} hrs/week</span>
                <span>40 hrs</span>
              </div>
            </div>

            {extractedData && (() => {
              // Calculate estimated total hours based on their resume and experience
              let estimatedHours = 100; // Base estimate
              
              // Adjust based on what's missing
              if (!extractedData.hasProductExperience) estimatedHours += 50;
              if (!extractedData.skills.includes('SQL')) estimatedHours += 15;
              if (!extractedData.hasMetrics) estimatedHours += 10;
              if (!extractedData.hasLeadership) estimatedHours += 20;
              
              // Advanced users need less time
              if (extractedData.hasProductExperience && extractedData.hasMetrics && extractedData.hasLeadership) {
                estimatedHours = 60; // Advanced level
              }
              
              const weeksNeeded = Math.ceil(estimatedHours / formData.hoursPerWeek);
              const monthsNeeded = Math.ceil(weeksNeeded / 4);
              
              return (
                <div className="p-4 rounded" style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
                  <p className="text-sm mb-3" style={{ color: 'rgba(112, 112, 112, 1)' }}>
                    Based on your skills and experience ({roadmap.userLevel?.level || 'current level'}), this roadmap requires approximately <span className="font-bold" style={{ color: 'rgba(21, 176, 120, 1)' }}>{estimatedHours} hours</span> of focused work.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="text-center p-3 rounded" style={{ backgroundColor: 'rgba(21, 176, 120, 0.1)' }}>
                      <p className="text-sm mb-1" style={{ color: 'rgba(112, 112, 112, 1)' }}>You're committing:</p>
                      <p className="text-2xl font-bold" style={{ color: 'rgba(21, 176, 120, 1)' }}>{formData.hoursPerWeek}</p>
                      <p className="text-xs" style={{ color: 'rgba(112, 112, 112, 1)' }}>hours/week</p>
                    </div>
                    
                    <div className="text-center p-3 rounded" style={{ backgroundColor: 'rgba(21, 176, 120, 0.1)' }}>
                      <p className="text-sm mb-1" style={{ color: 'rgba(112, 112, 112, 1)' }}>Time to complete:</p>
                      <p className="text-2xl font-bold" style={{ color: 'rgba(21, 176, 120, 1)' }}>{monthsNeeded}</p>
                      <p className="text-xs" style={{ color: 'rgba(112, 112, 112, 1)' }}>{monthsNeeded === 1 ? 'month' : 'months'} ({weeksNeeded} weeks)</p>
                    </div>
                  </div>
                  
                  <p className="text-sm text-center" style={{ color: 'rgba(51, 51, 51, 1)' }}>
                    {formData.hoursPerWeek >= 20 ? '🚀 Lightning fast! Perfect for urgent career transitions.' : 
                     formData.hoursPerWeek >= 15 ? '⚡ Intensive pace - great for focused transitions!' : 
                     formData.hoursPerWeek >= 10 ? '✨ Balanced pace - sustainable while working/studying' : 
                     formData.hoursPerWeek >= 7 ? '🎯 Steady pace - perfect for busy schedules' :
                     '🌱 Relaxed pace - low pressure, consistent progress'}
                  </p>
                </div>
              );
            })()}
          </div>

          <div className="mb-12 p-6 rounded-lg border-l-4" style={{ backgroundColor: 'rgba(255, 250, 240, 1)', borderColor: 'rgba(21, 176, 120, 1)' }}>
            <h3 className="font-bold mb-4 flex items-center gap-2 text-lg" style={{ color: 'rgba(51, 51, 51, 1)' }}>
              <AlertCircle size={24} style={{ color: 'rgba(21, 176, 120, 1)' }} />
              What's Missing From Your Resume
            </h3>
            <ul className="space-y-2 mb-4">
              {roadmap.gaps.map((gap, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span style={{ color: 'rgba(21, 176, 120, 1)' }}>→</span>
                  <span style={{ color: 'rgba(51, 51, 51, 1)' }}>{gap}</span>
                </li>
              ))}
            </ul>
            
            {roadmap.missingSkills && roadmap.missingSkills.length > 0 && (
              <div className="mt-4 p-4 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                <p className="font-medium mb-2" style={{ color: 'rgba(185, 28, 28, 1)' }}>Critical Skills to Develop:</p>
                <p style={{ color: 'rgba(51, 51, 51, 1)' }}>{roadmap.missingSkills.join(', ')}</p>
              </div>
            )}
            
            {roadmap.existingStrengths && roadmap.existingStrengths.length > 0 && (
              <div className="mt-4 p-4 rounded" style={{ backgroundColor: 'rgba(21, 176, 120, 0.1)' }}>
                <p className="font-medium mb-2" style={{ color: 'rgba(21, 176, 120, 1)' }}>Your Existing Strengths:</p>
                <p style={{ color: 'rgba(51, 51, 51, 1)' }}>{roadmap.existingStrengths.join(', ')}</p>
              </div>
            )}
          </div>

          <div className="space-y-8 mb-12">
            {[roadmap.phase1, roadmap.phase2, roadmap.phase3].map((phase, phaseIdx) => (
              <div key={phaseIdx} className="border-2 rounded-lg p-8 transition-all duration-300 hover:shadow-xl" style={{ borderColor: 'rgba(21, 176, 120, 1)' }}>
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white flex-shrink-0 shadow-lg" style={{ backgroundColor: 'rgba(21, 176, 120, 1)' }}>
                    {phaseIdx + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-2" style={{ color: 'rgba(51, 51, 51, 1)' }}>
                      {phase.title}
                    </h3>
                    <p className="mb-6 text-lg" style={{ color: 'rgba(112, 112, 112, 1)' }}>
                      {phase.description}
                    </p>

                    {phase.motivationNote && (
                      <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'rgba(21, 176, 120, 0.1)' }}>
                        <p className="text-sm font-medium mb-1" style={{ color: 'rgba(21, 176, 120, 1)' }}>Based on your motivation:</p>
                        <p className="text-sm" style={{ color: 'rgba(51, 51, 51, 1)' }}>{phase.motivationNote}</p>
                      </div>
                    )}

                    {phase.challengeNote && (
                      <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'rgba(21, 176, 120, 0.1)' }}>
                        <p className="text-sm font-medium mb-1" style={{ color: 'rgba(21, 176, 120, 1)' }}>Addressing your concern:</p>
                        <p className="text-sm" style={{ color: 'rgba(51, 51, 51, 1)' }}>{phase.challengeNote}</p>
                      </div>
                    )}

                    <div className="space-y-4">
                      {phase.actions.map((action, idx) => {
                        const isCompleted = completedActions[`${phaseIdx}-${idx}`];
                        return (
                          <div key={idx} className={`p-4 rounded-lg transition-all ${isCompleted ? 'opacity-60' : ''}`} style={{ backgroundColor: 'rgba(196, 235, 221, 0.15)' }}>
                            <div className="flex items-start gap-3 mb-2">
                              {/* Checkbox for completion */}
                              <input
                                type="checkbox"
                                checked={isCompleted || false}
                                onChange={() => handleToggleComplete(phaseIdx, idx)}
                                className="mt-1 w-5 h-5 cursor-pointer"
                                style={{ accentColor: 'rgba(21, 176, 120, 1)' }}
                              />
                              
                              <div className="flex-1">
                                <div className="flex items-start gap-2 mb-1">
                                  {editMode ? (
                                    <input
                                      type="text"
                                      value={action.action}
                                      onChange={(e) => handleEditAction(phaseIdx, idx, 'action', e.target.value)}
                                      className="font-semibold flex-1 px-2 py-1 border rounded"
                                      style={{ color: 'rgba(51, 51, 51, 1)', borderColor: 'rgba(21, 176, 120, 1)' }}
                                    />
                                  ) : (
                                    <p className={`font-semibold flex-1 ${isCompleted ? 'line-through' : ''}`} style={{ color: 'rgba(51, 51, 51, 1)' }}>
                                      {action.action}
                                    </p>
                                  )}
                                  {action.priority === 'HIGH' && !editMode && (
                                    <span className="px-2 py-1 rounded text-xs font-bold" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: 'rgba(185, 28, 28, 1)' }}>
                                      HIGH PRIORITY
                                    </span>
                                  )}
                                  {editMode && (
                                    <button
                                      onClick={() => handleDeleteAction(phaseIdx, idx)}
                                      className="px-2 py-1 rounded text-xs font-bold hover:bg-red-100"
                                      style={{ color: 'rgba(185, 28, 28, 1)' }}
                                    >
                                      Delete
                                    </button>
                                  )}
                                </div>
                                {action.reason && !editMode && (
                                  <p className="text-sm mb-2 italic" style={{ color: 'rgba(185, 28, 28, 1)' }}>
                                    Why: {action.reason}
                                  </p>
                                )}
                                {action.link && !editMode && (
                                  <a href={action.link} target="_blank" rel="noopener noreferrer" className="text-sm mt-1 inline-flex items-center gap-1" style={{ color: 'rgba(21, 176, 120, 1)' }}>
                                    View resource <ExternalLink size={14} />
                                  </a>
                                )}
                              </div>
                            </div>
                            <div className="ml-8 text-sm space-y-1">
                              <p><span className="font-medium">Skills:</span> {action.skills.join(', ')}</p>
                              {editMode ? (
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">Time:</span>
                                  <input
                                    type="text"
                                    value={action.time}
                                    onChange={(e) => handleEditAction(phaseIdx, idx, 'time', e.target.value)}
                                    className="px-2 py-1 border rounded text-sm"
                                    style={{ borderColor: 'rgba(21, 176, 120, 1)' }}
                                  />
                                </div>
                              ) : (
                                <p><span className="font-medium">Time:</span> {action.time}</p>
                              )}
                              {action.resumeImpact && !editMode && (
                                <div className="mt-2 p-3 rounded" style={{ backgroundColor: 'rgba(21, 176, 120, 0.1)' }}>
                                  <p className="font-medium mb-1" style={{ color: 'rgba(21, 176, 120, 1)' }}>
                                    Impact:
                                  </p>
                                  <p style={{ color: 'rgba(51, 51, 51, 1)' }}>{action.resumeImpact}</p>
                                </div>
                              )}
                              
                              {action.completionOutcome && !editMode && (
                                <div className="mt-2 p-3 rounded" style={{ backgroundColor: 'rgba(240, 249, 255, 1)', border: '1px solid rgba(191, 219, 254, 1)' }}>
                                  <p className="font-medium mb-1" style={{ color: 'rgba(37, 99, 235, 1)' }}>
                                    ✓ After Completion:
                                  </p>
                                  <p className="text-sm" style={{ color: 'rgba(51, 51, 51, 1)' }}>{action.completionOutcome}</p>
                                </div>
                              )}
                              
                              {/* Expandable How-To Tips Section */}
                              {action.howToTips && !editMode && (
                                <div className="mt-3">
                                  <button
                                    onClick={() => toggleTips(phaseIdx, idx)}
                                    className="flex items-center gap-2 text-sm font-medium hover:underline"
                                    style={{ color: 'rgba(21, 176, 120, 1)' }}
                                  >
                                    <Lightbulb size={16} />
                                    How to tackle this
                                    {expandedTips[`${phaseIdx}-${idx}`] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                  </button>

                                  {expandedTips[`${phaseIdx}-${idx}`] && (
                                    <div className="mt-2 ml-6 space-y-2 p-3 rounded" style={{ backgroundColor: 'rgba(240, 253, 244, 1)' }}>
                                      {action.howToTips.map((tip, tipIdx) => (
                                        <p key={tipIdx} className="text-sm" style={{ color: 'rgba(51, 51, 51, 1)' }}>
                                          {tip}
                                        </p>
                                      ))}

                                      {action.practicalSteps && (
                                        <div className="mt-3 p-3 rounded" style={{ backgroundColor: 'white', border: '1px solid rgba(21, 176, 120, 0.3)' }}>
                                          <p className="text-sm font-medium mb-2" style={{ color: 'rgba(21, 176, 120, 1)' }}>
                                            📋 Step-by-Step:
                                          </p>
                                          <ul className="space-y-1">
                                            {action.practicalSteps.map((step, stepIdx) => (
                                              <li key={stepIdx} className="text-sm" style={{ color: 'rgba(75, 85, 99, 1)' }}>
                                                • {step}
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Expandable Study Guide Section */}
                              {action.studyGuide && !editMode && (
                                <div className="mt-3">
                                  <button
                                    onClick={() => toggleStudyGuide(phaseIdx, idx)}
                                    className="flex items-center gap-2 text-sm font-medium hover:underline"
                                    style={{ color: 'rgba(21, 176, 120, 1)' }}
                                  >
                                    <BookOpen size={16} />
                                    Study Guide
                                    {expandedStudyGuides[`${phaseIdx}-${idx}`] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                  </button>

                                  {expandedStudyGuides[`${phaseIdx}-${idx}`] && (
                                    <div className="mt-2 ml-6 space-y-3 p-4 rounded" style={{ backgroundColor: 'rgba(249, 250, 251, 1)', border: '1px solid rgba(209, 213, 219, 1)' }}>
                                      <p className="text-sm" style={{ color: 'rgba(75, 85, 99, 1)' }}>
                                        {action.studyGuide.overview}
                                      </p>

                                      {action.studyGuide.chapters && action.studyGuide.chapters.map((chapter, chapterIdx) => (
                                        <div key={chapterIdx} className="p-3 rounded" style={{ backgroundColor: 'white' }}>
                                          <h5 className="font-bold text-sm mb-2" style={{ color: 'rgba(51, 51, 51, 1)' }}>
                                            {chapter.section} • {chapter.timeframe}
                                          </h5>
                                          
                                          {chapter.keyTopics && (
                                            <div className="mb-2">
                                              <p className="text-xs font-medium mb-1" style={{ color: 'rgba(112, 112, 112, 1)' }}>
                                                Key Topics:
                                              </p>
                                              <ul className="space-y-1">
                                                {chapter.keyTopics.map((topic, topicIdx) => (
                                                  <li key={topicIdx} className="text-sm" style={{ color: 'rgba(51, 51, 51, 1)' }}>
                                                    • {topic}
                                                  </li>
                                                ))}
                                              </ul>
                                            </div>
                                          )}

                                          {chapter.reflectionQuestions && (
                                            <div className="mb-2">
                                              <p className="text-xs font-medium mb-1" style={{ color: 'rgba(112, 112, 112, 1)' }}>
                                                Reflection Questions:
                                              </p>
                                              <ul className="space-y-1">
                                                {chapter.reflectionQuestions.map((question, qIdx) => (
                                                  <li key={qIdx} className="text-sm" style={{ color: 'rgba(51, 51, 51, 1)' }}>
                                                    💭 {question}
                                                  </li>
                                                ))}
                                              </ul>
                                            </div>
                                          )}

                                          {chapter.actionItems && (
                                            <div>
                                              <p className="text-xs font-medium mb-1" style={{ color: 'rgba(112, 112, 112, 1)' }}>
                                                Action Items:
                                              </p>
                                              <ul className="space-y-1">
                                                {chapter.actionItems.map((item, itemIdx) => (
                                                  <li key={itemIdx} className="text-sm" style={{ color: 'rgba(51, 51, 51, 1)' }}>
                                                    ✅ {item}
                                                  </li>
                                                ))}
                                              </ul>
                                            </div>
                                          )}
                                        </div>
                                      ))}

                                      {action.studyGuide.finalProject && (
                                        <div className="p-3 rounded" style={{ backgroundColor: 'rgba(240, 253, 244, 1)', border: '1px solid rgba(21, 176, 120, 1)' }}>
                                          <p className="text-sm font-bold mb-2" style={{ color: 'rgba(21, 128, 61, 1)' }}>
                                            🎯 Final Project:
                                          </p>
                                          <p className="text-sm whitespace-pre-line" style={{ color: 'rgba(51, 51, 51, 1)' }}>
                                            {action.studyGuide.finalProject}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Add Action Button in Edit Mode */}
                      {editMode && (
                        <button
                          onClick={() => handleAddAction(phaseIdx)}
                          className="w-full p-4 rounded-lg border-2 border-dashed transition-all hover:bg-gray-50"
                          style={{ borderColor: 'rgba(21, 176, 120, 1)', color: 'rgba(21, 176, 120, 1)' }}
                        >
                          + Add Custom Action
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4 justify-center mb-8 flex-wrap">
            <button
              onClick={handleExportRoadmap}
              className="px-8 py-4 rounded-lg font-semibold text-white transition-all hover:shadow-lg flex items-center gap-2"
              style={{ backgroundColor: 'rgba(21, 176, 120, 1)' }}
            >
              <FileText size={20} />
              Download as PDF
            </button>
            <button
              onClick={handleReset}
              className="px-8 py-4 rounded-lg font-semibold transition-all hover:shadow-lg flex items-center gap-2"
              style={{ backgroundColor: 'white', border: '2px solid rgba(21, 176, 120, 1)', color: 'rgba(21, 176, 120, 1)' }}
            >
              <Upload size={20} />
              Analyze New Resume
            </button>
            <button
              className="px-8 py-4 rounded-lg font-semibold transition-all hover:shadow-lg flex items-center gap-2"
              style={{ backgroundColor: 'white', border: '2px solid rgba(21, 176, 120, 1)', color: 'rgba(21, 176, 120, 1)' }}
            >
              <Send size={20} />
              Share with Coach
            </button>
          </div>

          <div className="text-center p-6 rounded-lg shadow-md" style={{ backgroundColor: 'rgba(196, 235, 221, 1)' }}>
            <p className="text-lg font-medium mb-4" style={{ color: 'rgba(51, 51, 51, 1)' }}>
              Your personalized roadmap is ready!
            </p>
            <p className="text-sm mb-4" style={{ color: 'rgba(112, 112, 112, 1)' }}>
              Start with Phase 1 and track your progress. Consider reviewing with a Leland coach for personalized feedback.
            </p>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="mt-4 px-6 py-2 rounded-lg font-medium transition-all"
              style={{ backgroundColor: 'white', color: 'rgba(21, 176, 120, 1)', border: '2px solid rgba(21, 176, 120, 1)' }}
            >
              Back to Top
            </button>
          </div>

          {/* Coach Recommendations Section */}
          <div className="mt-16 p-8 rounded-lg" style={{ backgroundColor: 'rgba(240, 253, 244, 1)', border: '2px solid rgba(21, 176, 120, 1)' }}>
            <h3 className="text-2xl font-bold mb-4 text-center" style={{ color: 'rgba(51, 51, 51, 1)' }}>
              🎯 Recommended Leland Coaches for Your Gaps
            </h3>
            <p className="text-center mb-6" style={{ color: 'rgba(112, 112, 112, 1)' }}>
              Based on skills you need to develop, these coaches can provide targeted guidance:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Technical Skills Coaches */}
              {(roadmap.missingSkills.includes('SQL') || roadmap.missingSkills.includes('Python/Analytics')) && (
                <div className="p-6 rounded-lg" style={{ backgroundColor: 'white', border: '1px solid rgba(229, 229, 229, 1)' }}>
                  <h4 className="font-bold text-lg mb-2" style={{ color: 'rgba(21, 176, 120, 1)' }}>For Technical Skills ({roadmap.missingSkills.filter(s => s.includes('SQL') || s.includes('Python') || s.includes('Analytics')).join(', ')})</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <a href="https://www.joinleland.com/coach/raghu-r/product-management" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline" style={{ color: 'rgba(21, 176, 120, 1)' }}>
                        Raghu R. - Google PM
                      </a>
                      <p style={{ color: 'rgba(112, 112, 112, 1)' }}>Technical PM interview prep, SQL and data analysis coaching</p>
                    </div>
                    <div>
                      <a href="https://www.joinleland.com/coach/parth-s/product-management" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline" style={{ color: 'rgba(21, 176, 120, 1)' }}>
                        Parth S. - Technical PM
                      </a>
                      <p style={{ color: 'rgba(112, 112, 112, 1)' }}>Helps build technical foundations for PMs</p>
                    </div>
                  </div>
                </div>
              )}

              {/* User Research & Product Strategy Coaches */}
              {(roadmap.missingSkills.includes('User Research') || roadmap.missingSkills.includes('Product Strategy') || roadmap.missingSkills.includes('A/B Testing')) && (
                <div className="p-6 rounded-lg" style={{ backgroundColor: 'white', border: '1px solid rgba(229, 229, 229, 1)' }}>
                  <h4 className="font-bold text-lg mb-2" style={{ color: 'rgba(21, 176, 120, 1)' }}>For Product Skills ({roadmap.missingSkills.filter(s => s.includes('Research') || s.includes('Strategy') || s.includes('Testing')).join(', ')})</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <a href="https://www.joinleland.com/coach/jamie-m/product-management" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline" style={{ color: 'rgba(21, 176, 120, 1)' }}>
                        Jamie M. - Product Strategy Expert
                      </a>
                      <p style={{ color: 'rgba(112, 112, 112, 1)' }}>User research, product discovery, and strategic thinking</p>
                    </div>
                    <div>
                      <a href="https://www.joinleland.com/coach/liza-m/product-management" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline" style={{ color: 'rgba(21, 176, 120, 1)' }}>
                        Liza M. - LinkedIn PM
                      </a>
                      <p style={{ color: 'rgba(112, 112, 112, 1)' }}>A/B testing, metrics, and product experimentation</p>
                    </div>
                  </div>
                </div>
              )}

              {/* No Product Experience - Get Started Coaches */}
              {!extractedData.hasProductExperience && (
                <div className="p-6 rounded-lg" style={{ backgroundColor: 'white', border: '1px solid rgba(229, 229, 229, 1)' }}>
                  <h4 className="font-bold text-lg mb-2" style={{ color: 'rgba(21, 176, 120, 1)' }}>For Building PM Experience from Scratch</h4>
                  <div className="space-y-3 text-sm">
                    {extractedData.isStudent ? (
                      <>
                        <div>
                          <a href="https://www.joinleland.com/coach/yiyang-hibner/product-management" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline" style={{ color: 'rgba(21, 176, 120, 1)' }}>
                            Yiyang H. - Meta PM
                          </a>
                          <p style={{ color: 'rgba(112, 112, 112, 1)' }}>Helps students build PM portfolios and lead projects</p>
                        </div>
                        <div>
                          <a href="https://www.joinleland.com/coach/dessy-k/product-management" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline" style={{ color: 'rgba(21, 176, 120, 1)' }}>
                            Dessy K. - Uber PM
                          </a>
                          <p style={{ color: 'rgba(112, 112, 112, 1)' }}>Case study development and product thinking coaching</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <a href="https://www.joinleland.com/coach/britton-o/product-management" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline" style={{ color: 'rgba(21, 176, 120, 1)' }}>
                            Britton O. - Ex-Amazon & Google PM
                          </a>
                          <p style={{ color: 'rgba(112, 112, 112, 1)' }}>Career transitions and building PM credibility from other roles</p>
                        </div>
                        <div>
                          <a href="https://www.joinleland.com/coach/sameer-b/product-management" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline" style={{ color: 'rgba(21, 176, 120, 1)' }}>
                            Sameer B. - Senior PM
                          </a>
                          <p style={{ color: 'rgba(112, 112, 112, 1)' }}>Helps professionals pivot and build PM portfolios</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* No Metrics - Resume & Storytelling Coaches */}
              {!extractedData.hasMetrics && (
                <div className="p-6 rounded-lg" style={{ backgroundColor: 'white', border: '1px solid rgba(229, 229, 229, 1)' }}>
                  <h4 className="font-bold text-lg mb-2" style={{ color: 'rgba(21, 176, 120, 1)' }}>For Resume Optimization & Quantifying Impact</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <a href="https://www.joinleland.com/coach/zane-homsi/product-management" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline" style={{ color: 'rgba(21, 176, 120, 1)' }}>
                        Zane H. - Amazon PM
                      </a>
                      <p style={{ color: 'rgba(112, 112, 112, 1)' }}>Resume optimization and quantifying impact with metrics</p>
                    </div>
                    <div>
                      <a href="https://www.joinleland.com/coach/melody-l/product-management" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline" style={{ color: 'rgba(21, 176, 120, 1)' }}>
                        Melody L. - Stripe PM
                      </a>
                      <p style={{ color: 'rgba(112, 112, 112, 1)' }}>Crafting compelling stories and showcasing results</p>
                    </div>
                  </div>
                </div>
              )}

              {/* No Leadership - Leadership Coaches */}
              {!extractedData.hasLeadership && (
                <div className="p-6 rounded-lg" style={{ backgroundColor: 'white', border: '1px solid rgba(229, 229, 229, 1)' }}>
                  <h4 className="font-bold text-lg mb-2" style={{ color: 'rgba(21, 176, 120, 1)' }}>For Developing Leadership & Influence</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <a href="https://www.joinleland.com/coach/shashank-agrawal/product-management" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline" style={{ color: 'rgba(21, 176, 120, 1)' }}>
                        Shashank A. - Product Leader
                      </a>
                      <p style={{ color: 'rgba(112, 112, 112, 1)' }}>Leadership skills, stakeholder management, and influence</p>
                    </div>
                    <div>
                      <a href="https://www.joinleland.com/coach/james-f/product-management" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline" style={{ color: 'rgba(21, 176, 120, 1)' }}>
                        James F. - Google PM
                      </a>
                      <p style={{ color: 'rgba(112, 112, 112, 1)' }}>Building leadership experience and leading cross-functional teams</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Interview Prep - Always show */}
              <div className="p-6 rounded-lg" style={{ backgroundColor: 'white', border: '1px solid rgba(229, 229, 229, 1)' }}>
                <h4 className="font-bold text-lg mb-2" style={{ color: 'rgba(21, 176, 120, 1)' }}>For Interview Preparation</h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <a href="https://www.joinleland.com/coach/daniel-m-2/product-management" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline" style={{ color: 'rgba(21, 176, 120, 1)' }}>
                      Daniel M. - Meta PM
                    </a>
                    <p style={{ color: 'rgba(112, 112, 112, 1)' }}>Mock interviews, case studies, and behavioral prep</p>
                  </div>
                  <div>
                    <a href="https://www.joinleland.com/coach/bryan-r/product-management" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline" style={{ color: 'rgba(21, 176, 120, 1)' }}>
                      Bryan R. - Product Expert
                    </a>
                    <p style={{ color: 'rgba(112, 112, 112, 1)' }}>Product sense, strategy cases, and communication</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <a 
                href="https://www.joinleland.com/coaching" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block px-8 py-3 rounded-lg font-semibold text-white transition-all hover:shadow-lg"
                style={{ backgroundColor: 'rgba(21, 176, 120, 1)' }}
              >
                Browse All PM Coaches
              </a>
            </div>
          </div>

          {/* PM Recruiting & Next Steps Section */}
          <div className="mt-16 p-8 rounded-lg" style={{ backgroundColor: 'rgba(239, 246, 255, 1)', border: '2px solid rgba(59, 130, 246, 1)' }}>
            <h3 className="text-2xl font-bold mb-4 text-center" style={{ color: 'rgba(51, 51, 51, 1)' }}>
              🚀 Ready to Apply? Your Next Steps
            </h3>
            <p className="text-center mb-8" style={{ color: 'rgba(112, 112, 112, 1)' }}>
              {extractedData.isStudent 
                ? "Learn about top APM programs, recruiting timelines, and how to stand out as a student candidate"
                : "Navigate the PM job market, understand the interview process, and learn how to position yourself for PM roles"}
            </p>

            <div className="space-y-6">
              {/* For Students - APM Programs Focus */}
              {extractedData.isStudent && (
                <>
                  <div className="p-6 rounded-lg" style={{ backgroundColor: 'white' }}>
                    <h4 className="font-bold text-xl mb-3 flex items-center gap-2" style={{ color: 'rgba(59, 130, 246, 1)' }}>
                      📚 APM Programs & Early Career Opportunities
                    </h4>
                    <p className="mb-4" style={{ color: 'rgba(112, 112, 112, 1)' }}>
                      Associate Product Manager (APM) programs are designed for recent grads and provide structured training to launch your PM career. Most programs recruit in the fall for the following summer.
                    </p>
                    
                    <div className="mb-4">
                      <p className="font-semibold mb-2" style={{ color: 'rgba(51, 51, 51, 1)' }}>🎯 Top APM Programs:</p>
                      <ul className="space-y-2 text-sm" style={{ color: 'rgba(112, 112, 112, 1)' }}>
                        <li>• <strong>Google APM:</strong> 2-year rotational program, highly competitive</li>
                        <li>• <strong>Meta RPM:</strong> Rotational Product Manager program</li>
                        <li>• <strong>Microsoft APM:</strong> 2-year program with rotations</li>
                        <li>• <strong>Uber APM:</strong> 18-month program</li>
                        <li>• <strong>Capital One APM:</strong> Focuses on fintech products</li>
                        <li>• <strong>LinkedIn APM:</strong> 2-year rotational program</li>
                      </ul>
                    </div>

                    <div className="mb-4">
                      <p className="font-semibold mb-2" style={{ color: 'rgba(51, 51, 51, 1)' }}>📅 Recruiting Timeline:</p>
                      <ul className="space-y-2 text-sm" style={{ color: 'rgba(112, 112, 112, 1)' }}>
                        <li>• <strong>July-August:</strong> Applications open for most programs</li>
                        <li>• <strong>September-November:</strong> First round interviews</li>
                        <li>• <strong>October-January:</strong> Final rounds and offers</li>
                        <li>• <strong>Summer:</strong> Most APM programs start</li>
                      </ul>
                    </div>

                    <div className="p-4 rounded" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                      <p className="text-sm mb-2" style={{ color: 'rgba(51, 51, 51, 1)' }}>
                        <strong>🔑 Pro Tip:</strong> Start preparing at least 2-3 months before applications open. Many students start in May-June for fall recruiting.
                      </p>
                    </div>

                    <div className="mt-4">
                      <a 
                        href="https://www.apmseason.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-all hover:shadow-lg"
                        style={{ backgroundColor: 'rgba(59, 130, 246, 1)' }}
                      >
                        <ExternalLink size={18} />
                        Explore APM Programs on APM Season
                      </a>
                    </div>
                  </div>
                </>
              )}

              {/* For Professionals - Broader PM Recruiting */}
              {!extractedData.isStudent && (
                <>
                  <div className="p-6 rounded-lg" style={{ backgroundColor: 'white' }}>
                    <h4 className="font-bold text-xl mb-3 flex items-center gap-2" style={{ color: 'rgba(59, 130, 246, 1)' }}>
                      💼 Finding PM Opportunities
                    </h4>
                    <p className="mb-4" style={{ color: 'rgba(112, 112, 112, 1)' }}>
                      As a career switcher, you'll be targeting mid-level PM roles rather than entry-level APM programs. Here's how to find and land these opportunities.
                    </p>
                    
                    <div className="mb-4">
                      <p className="font-semibold mb-2" style={{ color: 'rgba(51, 51, 51, 1)' }}>🔍 Where to Find PM Jobs:</p>
                      <ul className="space-y-2 text-sm" style={{ color: 'rgba(112, 112, 112, 1)' }}>
                        <li>• <strong>LinkedIn:</strong> Set alerts for "Product Manager" at target companies</li>
                        <li>• <strong>Company Career Pages:</strong> Apply directly to smaller, growing companies</li>
                        <li>• <strong>Product Manager HQ:</strong> Job board specifically for PM roles</li>
                        <li>• <strong>Networking:</strong> Referrals are the #1 way to get interviews - leverage your network</li>
                        <li>• <strong>Startup Job Boards:</strong> AngelList, Y Combinator jobs for earlier-stage opportunities</li>
                      </ul>
                    </div>

                    <div className="mb-4">
                      <p className="font-semibold mb-2" style={{ color: 'rgba(51, 51, 51, 1)' }}>🎯 Target the Right Companies:</p>
                      <ul className="space-y-2 text-sm" style={{ color: 'rgba(112, 112, 112, 1)' }}>
                        <li>• <strong>Startups (Series A-C):</strong> More willing to take bets on career switchers, faster growth</li>
                        <li>• <strong>Mid-size Tech (100-1000 employees):</strong> Growing PM teams, looking for diverse backgrounds</li>
                        <li>• <strong>Enterprise Software:</strong> If you have domain expertise in their industry</li>
                        <li>• <strong>Less Competitive Companies First:</strong> Build PM experience, then aim for FAANG</li>
                      </ul>
                    </div>

                    <div className="p-4 rounded" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                      <p className="text-sm mb-2" style={{ color: 'rgba(51, 51, 51, 1)' }}>
                        <strong>🔑 Pro Tip:</strong> Don't just apply blindly. Reach out to PMs at target companies on LinkedIn, ask for informational interviews, and get referrals. Referrals increase your chance of getting an interview by 5-10x.
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Interview Process - For Everyone */}
              <div className="p-6 rounded-lg" style={{ backgroundColor: 'white' }}>
                <h4 className="font-bold text-xl mb-3 flex items-center gap-2" style={{ color: 'rgba(59, 130, 246, 1)' }}>
                  🎯 The PM Interview Process
                </h4>
                <p className="mb-4" style={{ color: 'rgba(112, 112, 112, 1)' }}>
                  Most PM interviews follow a similar structure, though the emphasis varies by company and seniority level.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <p className="font-semibold mb-2" style={{ color: 'rgba(51, 51, 51, 1)' }}>📞 Typical Interview Stages:</p>
                    <div className="space-y-3">
                      <div className="p-3 rounded" style={{ backgroundColor: 'rgba(248, 250, 252, 1)' }}>
                        <p className="font-medium text-sm mb-1" style={{ color: 'rgba(51, 51, 51, 1)' }}>1. Recruiter Screen (30 min)</p>
                        <p className="text-sm" style={{ color: 'rgba(112, 112, 112, 1)' }}>Your background, motivation for PM, salary expectations. Prepare your "why PM" story.</p>
                      </div>
                      
                      <div className="p-3 rounded" style={{ backgroundColor: 'rgba(248, 250, 252, 1)' }}>
                        <p className="font-medium text-sm mb-1" style={{ color: 'rgba(51, 51, 51, 1)' }}>2. Product Sense (45-60 min)</p>
                        <p className="text-sm" style={{ color: 'rgba(112, 112, 112, 1)' }}>"Design a product for X" or "Improve Y feature" - tests your product thinking and user empathy.</p>
                      </div>
                      
                      <div className="p-3 rounded" style={{ backgroundColor: 'rgba(248, 250, 252, 1)' }}>
                        <p className="font-medium text-sm mb-1" style={{ color: 'rgba(51, 51, 51, 1)' }}>3. Analytical/Metrics (45-60 min)</p>
                        <p className="text-sm" style={{ color: 'rgba(112, 112, 112, 1)' }}>Root cause analysis, metrics tradeoffs, A/B test design. Sometimes includes SQL or data questions.</p>
                      </div>
                      
                      <div className="p-3 rounded" style={{ backgroundColor: 'rgba(248, 250, 252, 1)' }}>
                        <p className="font-medium text-sm mb-1" style={{ color: 'rgba(51, 51, 51, 1)' }}>4. Behavioral (45-60 min)</p>
                        <p className="text-sm" style={{ color: 'rgba(112, 112, 112, 1)' }}>Leadership, conflict resolution, past projects using STAR method. Shows your collaboration and execution skills.</p>
                      </div>
                      
                      <div className="p-3 rounded" style={{ backgroundColor: 'rgba(248, 250, 252, 1)' }}>
                        <p className="font-medium text-sm mb-1" style={{ color: 'rgba(51, 51, 51, 1)' }}>5. Technical/Execution (30-45 min)</p>
                        <p className="text-sm" style={{ color: 'rgba(112, 112, 112, 1)' }}>How you'd work with engineers, prioritization frameworks, maybe system design basics.</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                    <p className="text-sm" style={{ color: 'rgba(51, 51, 51, 1)' }}>
                      <strong>✅ What Companies Look For:</strong> Product sense, analytical thinking, execution ability, communication skills, and culture fit. Your roadmap above prepares you for all of these!
                    </p>
                  </div>
                </div>
              </div>

              {/* Resources Section */}
              <div className="p-6 rounded-lg" style={{ backgroundColor: 'white' }}>
                <h4 className="font-bold text-xl mb-3 flex items-center gap-2" style={{ color: 'rgba(59, 130, 246, 1)' }}>
                  📚 Essential PM Resources
                </h4>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold mb-2 text-sm" style={{ color: 'rgba(51, 51, 51, 1)' }}>Recruiting & Job Search:</p>
                    <ul className="space-y-2 text-sm" style={{ color: 'rgba(112, 112, 112, 1)' }}>
                      <li>
                        <a href="https://www.apmseason.com" target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1" style={{ color: 'rgba(59, 130, 246, 1)' }}>
                          <ExternalLink size={14} />
                          APM Season - APM program tracker & timelines
                        </a>
                      </li>
                      <li>
                        <a href="https://www.productmanagerhq.com/job-board/" target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1" style={{ color: 'rgba(59, 130, 246, 1)' }}>
                          <ExternalLink size={14} />
                          Product Manager HQ - PM job board
                        </a>
                      </li>
                      <li>
                        <a href="https://www.joinleland.com/library?categories=product-management" target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1" style={{ color: 'rgba(59, 130, 246, 1)' }}>
                          <ExternalLink size={14} />
                          Leland Library - PM career guides
                        </a>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold mb-2 text-sm" style={{ color: 'rgba(51, 51, 51, 1)' }}>Interview Prep:</p>
                    <ul className="space-y-2 text-sm" style={{ color: 'rgba(112, 112, 112, 1)' }}>
                      <li>
                        <a href="https://www.tryexponent.com/courses/pm" target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1" style={{ color: 'rgba(59, 130, 246, 1)' }}>
                          <ExternalLink size={14} />
                          Exponent - PM interview courses & practice
                        </a>
                      </li>
                      <li>
                        <a href="https://www.productalliance.com/" target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1" style={{ color: 'rgba(59, 130, 246, 1)' }}>
                          <ExternalLink size={14} />
                          Product Alliance - Company-specific prep
                        </a>
                      </li>
                      <li>
                        <a href="https://www.lennysnewsletter.com/" target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1" style={{ color: 'rgba(59, 130, 246, 1)' }}>
                          <ExternalLink size={14} />
                          Lenny's Newsletter - PM insights & career advice
                        </a>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold mb-2 text-sm" style={{ color: 'rgba(51, 51, 51, 1)' }}>Communities & Networking:</p>
                    <ul className="space-y-2 text-sm" style={{ color: 'rgba(112, 112, 112, 1)' }}>
                      <li>
                        <a href="https://www.productschool.com/slack-community/" target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1" style={{ color: 'rgba(59, 130, 246, 1)' }}>
                          <ExternalLink size={14} />
                          Product School Slack - 40k+ PMs
                        </a>
                      </li>
                      <li>
                        <a href="https://www.mindtheproduct.com/" target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1" style={{ color: 'rgba(59, 130, 246, 1)' }}>
                          <ExternalLink size={14} />
                          Mind the Product - PM community & events
                        </a>
                      </li>
                      <li>
                        <a href="https://www.linkedin.com/groups/42735/" target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1" style={{ color: 'rgba(59, 130, 246, 1)' }}>
                          <ExternalLink size={14} />
                          Product Management LinkedIn Group
                        </a>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold mb-2 text-sm" style={{ color: 'rgba(51, 51, 51, 1)' }}>Learning & Development:</p>
                    <ul className="space-y-2 text-sm" style={{ color: 'rgba(112, 112, 112, 1)' }}>
                      <li>
                        <a href="https://www.reforge.com/" target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1" style={{ color: 'rgba(59, 130, 246, 1)' }}>
                          <ExternalLink size={14} />
                          Reforge - Advanced PM courses
                        </a>
                      </li>
                      <li>
                        <a href="https://www.producttalk.org/" target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1" style={{ color: 'rgba(59, 130, 246, 1)' }}>
                          <ExternalLink size={14} />
                          Product Talk - Teresa Torres' blog
                        </a>
                      </li>
                      <li>
                        <a href="https://www.svpg.com/articles/" target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1" style={{ color: 'rgba(59, 130, 246, 1)' }}>
                          <ExternalLink size={14} />
                          Silicon Valley Product Group - Marty Cagan
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Items */}
              <div className="p-6 rounded-lg" style={{ backgroundColor: 'rgba(21, 176, 120, 0.1)', border: '2px solid rgba(21, 176, 120, 1)' }}>
                <h4 className="font-bold text-xl mb-3" style={{ color: 'rgba(51, 51, 51, 1)' }}>
                  ✅ Your Action Plan
                </h4>
                <ol className="space-y-2 text-sm" style={{ color: 'rgba(51, 51, 51, 1)' }}>
                  <li><strong>1. Complete your roadmap above</strong> - Build the skills and portfolio you need</li>
                  <li><strong>2. {extractedData.isStudent ? 'Track APM recruiting timelines' : 'Start networking and applying'}</strong> - {extractedData.isStudent ? 'Set reminders for application deadlines (typically July-August)' : 'Reach out to PMs, ask for referrals, apply to 10-15 companies'}</li>
                  <li><strong>3. Practice interviews consistently</strong> - Do 3-5 mock interviews with peers or coaches</li>
                  <li><strong>4. Join PM communities</strong> - Learn from others, share your journey, make connections</li>
                  <li><strong>5. Stay persistent</strong> - Landing your first PM role takes time. Keep iterating on your story and skills!</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Celebration Modal */}
      {showCelebration && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setShowCelebration(null)}
        >
          <div 
            className="relative max-w-lg w-full mx-4 p-8 rounded-2xl shadow-2xl text-center"
            style={{ backgroundColor: 'white' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowCelebration(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-bold"
              aria-label="Close"
            >
              ×
            </button>

            {/* Celebration content based on phase */}
            {showCelebration === 'phase1' && (
              <>
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-3xl font-bold mb-4" style={{ color: 'rgba(21, 176, 120, 1)' }}>
                  Phase 1 Complete!
                </h2>
                <p className="text-lg mb-2" style={{ color: 'rgba(51, 51, 51, 1)' }}>
                  Incredible work! You've built your product foundations.
                </p>
                <p className="text-base" style={{ color: 'rgba(112, 112, 112, 1)' }}>
                  You now understand PM fundamentals, have critical technical skills, and can think like a product manager. You're ready to start building real PM experience!
                </p>
              </>
            )}

            {showCelebration === 'phase2' && (
              <>
                <div className="text-6xl mb-4">🚀</div>
                <h2 className="text-3xl font-bold mb-4" style={{ color: 'rgba(21, 176, 120, 1)' }}>
                  Phase 2 Complete!
                </h2>
                <p className="text-lg mb-2" style={{ color: 'rgba(51, 51, 51, 1)' }}>
                  Amazing progress! You've built real PM credibility.
                </p>
                <p className="text-base" style={{ color: 'rgba(112, 112, 112, 1)' }}>
                  You now have concrete PM projects, hands-on experience, and compelling stories to tell in interviews. Your resume has transformed from potential to proof!
                </p>
              </>
            )}

            {showCelebration === 'phase3' && (
              <>
                <div className="text-6xl mb-4">🎊</div>
                <h2 className="text-3xl font-bold mb-4" style={{ color: 'rgba(21, 176, 120, 1)' }}>
                  Roadmap Complete!
                </h2>
                <p className="text-lg mb-2" style={{ color: 'rgba(51, 51, 51, 1)' }}>
                  You did it! You're ready for PM roles.
                </p>
                <p className="text-base" style={{ color: 'rgba(112, 112, 112, 1)' }}>
                  You have the skills, the experience, the portfolio, and the interview preparation. You've transformed from aspiring PM to interview-ready candidate. Now go land that PM role! 💪
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CareerPathAI;