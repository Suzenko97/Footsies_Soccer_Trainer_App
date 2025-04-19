// src/Services/statService.js
import { auth, db } from '../Config/firebase';
import { 
  doc, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  getDoc,
  updateDoc,
  setDoc
} from 'firebase/firestore';

// Current session tracking
let currentSession = null;
let lastSaveTime = 0; // Track the last time a session was saved

// Initialize a new session for the current login
export const initializeSession = () => {
  console.log("Initializing new training session");
  currentSession = {
    startTime: new Date(),
    metrics: {},
    skillsChanged: [],
    totalDuration: 0
  };
  console.log("Session initialized:", currentSession);
};

// Record a skill training activity to the current session
export const recordSkillTraining = (skillName, xpGained, duration) => {
  console.log(`Recording skill training: ${skillName}, XP: ${xpGained}, Duration: ${duration}`);
  
  if (!currentSession) {
    console.log("No active session found, initializing a new one");
    initializeSession();
  }
  
  // Add or update the skill in the metrics
  if (!currentSession.metrics[skillName]) {
    currentSession.metrics[skillName] = xpGained;
    currentSession.skillsChanged.push(skillName);
  } else {
    currentSession.metrics[skillName] += xpGained;
  }
  
  // Update total duration
  currentSession.totalDuration += (duration || 0);
  
  console.log("Updated session:", currentSession);
};

// Save the current session to Firestore if any skills were trained
export const saveCurrentSession = async (userId) => {
  console.log("Attempting to save session for user:", userId);
  console.log("Current session state:", currentSession);
  
  try {
    // Only save if there are skills that changed
    if (!userId) {
      console.error("Cannot save session: No user ID provided");
      return false;
    }
    
    if (!currentSession) {
      console.log("No active session to save");
      return false;
    }
    
    if (currentSession.skillsChanged.length === 0) {
      console.log("No skills changed in this session, nothing to save");
      return false;
    }
    
    // Prevent duplicate saves within a short time period (5 seconds)
    const now = Date.now();
    if (now - lastSaveTime < 5000) {
      console.log("Session was recently saved, skipping to prevent duplicates");
      return {
        success: true,
        sessionData: {...currentSession},
        skipped: true
      };
    }
    
    console.log("Saving session with skills:", currentSession.skillsChanged);
    
    const sessionsRef = collection(db, "Users", userId, "sessions");
    const timestamp = Timestamp.now();
    
    // Create a copy of the current session data to save
    const session = {
      timestamp,
      date: timestamp.toDate().toISOString().split('T')[0],
      startTime: Timestamp.fromDate(currentSession.startTime),
      endTime: timestamp,
      duration: currentSession.totalDuration,
      metrics: {...currentSession.metrics},
      skillsChanged: [...currentSession.skillsChanged]
    };
    
    console.log("Session data to save:", session);
    
    const docRef = await addDoc(sessionsRef, session);
    console.log("Session saved successfully with ID:", docRef.id);
    
    // Update user's total sessions count
    const userRef = doc(db, "Users", userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      await updateDoc(userRef, { 
        totalSessions: (userData.totalSessions || 0) + 1,
        lastTrainingDate: timestamp
      });
      console.log("User total sessions updated");
    } else {
      console.error("User document not found");
    }
    
    // Update the last save time
    lastSaveTime = now;
    
    // Always reset the session after saving during logout
    const oldSession = {...currentSession};
    currentSession = null;
    console.log("Session reset after saving");
    
    return {
      success: true,
      sessionData: oldSession,
      docId: docRef.id
    };
  } catch (error) {
    console.error("Error saving training session:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Save and end the current session (for logout/app close)
export const saveAndEndSession = async (userId) => {
  try {
    // Save the current session
    const saveResult = await saveCurrentSession(userId);
    
    // Reset the session regardless of save result
    const oldSession = currentSession ? {...currentSession} : null;
    currentSession = null;
    console.log("Session ended after saving");
    
    return {
      ...saveResult,
      sessionEnded: true,
      oldSession
    };
  } catch (error) {
    console.error("Error ending session:", error);
    // Still reset the session even if there was an error
    currentSession = null;
    return {
      success: false,
      sessionEnded: true,
      error: error.message
    };
  }
};

// Record a new training session (legacy method - will be replaced by the new system)
export const recordTrainingSession = async (userId, sessionData) => {
  try {
    // Use the new system to record this training
    recordSkillTraining(
      sessionData.sessionType, 
      sessionData.metrics[sessionData.sessionType], 
      sessionData.duration
    );
    
    return true;
  } catch (error) {
    console.error("Error recording training session:", error);
    throw error;
  }
};

// Get user's training sessions
export const getUserSessions = async (userId, limitCount = 10) => {
  try {
    const sessionsRef = collection(db, "Users", userId, "sessions");
    const q = query(sessionsRef, orderBy("timestamp", "desc"), limit(limitCount));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting user sessions:", error);
    throw error;
  }
};

// Get training frequency stats
export const getTrainingFrequencyStats = async (userId) => {
  try {
    const sessionsRef = collection(db, "Users", userId, "sessions");
    const querySnapshot = await getDocs(sessionsRef);
    
    const sessions = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date || doc.data().timestamp.toDate().toISOString().split('T')[0]
    }));
    
    // Calculate daily, weekly, and monthly counts
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const dailySessions = sessions.filter(session => {
      const sessionDate = new Date(session.date);
      return sessionDate >= oneDayAgo;
    });
    
    const weeklySessions = sessions.filter(session => {
      const sessionDate = new Date(session.date);
      return sessionDate >= oneWeekAgo;
    });
    
    const monthlySessions = sessions.filter(session => {
      const sessionDate = new Date(session.date);
      return sessionDate >= oneMonthAgo;
    });
    
    // Calculate average sessions per week over the last month
    const weekCount = Math.ceil(30 / 7);
    const avgSessionsPerWeek = monthlySessions.length / weekCount;
    
    return {
      totalSessions: sessions.length,
      dailySessions: dailySessions.length,
      weeklySessions: weeklySessions.length,
      monthlySessions: monthlySessions.length,
      avgSessionsPerWeek: avgSessionsPerWeek
    };
  } catch (error) {
    console.error("Error getting training frequency stats:", error);
    throw error;
  }
};

// Get skill progress over time
export const getSkillProgressStats = async (userId) => {
  try {
    const sessionsRef = collection(db, "Users", userId, "sessions");
    const querySnapshot = await getDocs(query(sessionsRef, orderBy("timestamp", "asc")));
    
    const sessions = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date || doc.data().timestamp.toDate().toISOString().split('T')[0]
    }));
    
    // Group sessions by skill and calculate rolling averages
    const skillProgress = {};
    const skills = ['dribbling', 'shooting', 'passing', 'defending', 'speed', 'stamina'];
    
    skills.forEach(skill => {
      const skillSessions = sessions.filter(session => 
        session.sessionType === skill || 
        (session.metrics && session.metrics[skill])
      );
      
      if (skillSessions.length > 0) {
        // Calculate 3-point rolling average
        const rollingAverages = [];
        for (let i = 0; i < skillSessions.length; i++) {
          const startIdx = Math.max(0, i - 2);
          const pointsToAverage = skillSessions.slice(startIdx, i + 1);
          const sum = pointsToAverage.reduce((acc, session) => {
            return acc + (session.metrics && session.metrics[skill] ? session.metrics[skill] : 0);
          }, 0);
          const avg = sum / pointsToAverage.length;
          
          rollingAverages.push({
            date: skillSessions[i].date,
            value: avg,
            raw: skillSessions[i].metrics && skillSessions[i].metrics[skill] ? skillSessions[i].metrics[skill] : 0
          });
        }
        
        skillProgress[skill] = rollingAverages;
      } else {
        skillProgress[skill] = [];
      }
    });
    
    return skillProgress;
  } catch (error) {
    console.error("Error getting skill progress stats:", error);
    throw error;
  }
};

// Get time since last improvement for each skill
export const getTimeSinceLastImprovement = async (userId) => {
  try {
    const userRef = doc(db, "Users", userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error("User not found");
    }
    
    const userData = userDoc.data();
    const sessionsRef = collection(db, "Users", userId, "sessions");
    const querySnapshot = await getDocs(query(sessionsRef, orderBy("timestamp", "desc")));
    
    const sessions = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date || doc.data().timestamp.toDate().toISOString().split('T')[0]
    }));
    
    const skills = ['dribbling', 'shooting', 'passing', 'defending', 'speed', 'stamina'];
    const lastImprovementDates = {};
    
    skills.forEach(skill => {
      // Find the most recent session where this skill improved
      const sessionWithImprovement = sessions.find(session => 
        session.metrics && 
        session.metrics[skill] && 
        session.metrics[skill] > 0
      );
      
      if (sessionWithImprovement) {
        lastImprovementDates[skill] = {
          date: sessionWithImprovement.date,
          timestamp: sessionWithImprovement.timestamp,
          daysSince: Math.floor((Date.now() - sessionWithImprovement.timestamp.toDate()) / (1000 * 60 * 60 * 24))
        };
      } else {
        lastImprovementDates[skill] = null;
      }
    });
    
    return lastImprovementDates;
  } catch (error) {
    console.error("Error getting time since last improvement:", error);
    throw error;
  }
};

// Get skill imbalance analysis
export const getSkillImbalanceAnalysis = async (userId) => {
  try {
    const userRef = doc(db, "Users", userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error("User not found");
    }
    
    const userData = userDoc.data();
    console.log("DEBUG - User data in getSkillImbalanceAnalysis:", userData);
    
    // Use skillLevels instead of raw XP values
    const skillLevels = userData.skillLevels || {};
    console.log("DEBUG - Skill levels data:", skillLevels);
    
    // Get raw XP values for reference
    const skills = userData.skills || {};
    console.log("DEBUG - Skills XP data:", skills);
    
    // Check if there are any skills with levels
    const skillEntries = Object.entries(skillLevels);
    console.log("DEBUG - Skill level entries:", skillEntries);
    
    if (skillEntries.length === 0) {
      return {
        avgSkillLevel: 0,
        strongestSkill: { name: "None", value: 0, level: 0 },
        weakestSkill: { name: "None", value: 0, level: 0 },
        imbalanceScore: 0,
        skillDeviations: {},
        imbalanceMessage: "No skills trained yet."
      };
    }
    
    // Calculate average skill level
    const skillValues = skillEntries.map(([_, level]) => level);
    const avgSkillLevel = skillValues.reduce((sum, val) => sum + val, 0) / skillValues.length;
    
    // Group skills by level to handle ties
    const skillsByLevel = {};
    Object.entries(skillLevels).forEach(([name, level]) => {
      if (!skillsByLevel[level]) {
        skillsByLevel[level] = [];
      }
      skillsByLevel[level].push({ name, level, value: skills[name] || 0 });
    });
    
    // Find highest and lowest levels
    const levels = Object.keys(skillsByLevel).map(Number).sort((a, b) => b - a);
    const highestLevel = levels[0];
    
    // Find lowest level that has been trained (value > 0)
    let lowestLevel = levels[levels.length - 1];
    for (const level of levels.slice().reverse()) {
      const hasTrainedSkill = skillsByLevel[level].some(skill => skill.value > 0);
      if (hasTrainedSkill) {
        lowestLevel = level;
        break;
      }
    }
    
    console.log(`DEBUG - Highest level: ${highestLevel}, Lowest level: ${lowestLevel}`);
    console.log(`DEBUG - Skills by level:`, skillsByLevel);
    
    // For strongest skill, if there's a tie at the highest level, use the one with most XP
    let strongestSkill = { name: "None", value: 0, level: 0 };
    if (skillsByLevel[highestLevel]) {
      strongestSkill = skillsByLevel[highestLevel].reduce((strongest, current) => {
        return current.value > strongest.value ? current : strongest;
      }, { name: "None", value: -Infinity, level: 0 });
    }
    
    // For weakest skill, if there's a tie at the lowest level, use the one with least XP
    let weakestSkill = { name: "None", value: 0, level: 0 };
    
    // Only consider skills that have been trained (value > 0)
    const trainedSkillsAtLowestLevel = skillsByLevel[lowestLevel]?.filter(skill => skill.value > 0) || [];
    
    if (trainedSkillsAtLowestLevel.length > 0) {
      weakestSkill = trainedSkillsAtLowestLevel.reduce((weakest, current) => {
        return current.value < weakest.value ? current : weakest;
      }, { name: "None", value: Infinity, level: lowestLevel });
    } else {
      // If no skills have been trained at the lowest level, check other levels
      for (const level of levels.slice().reverse()) {
        const trainedSkills = skillsByLevel[level]?.filter(skill => skill.value > 0) || [];
        if (trainedSkills.length > 0) {
          weakestSkill = trainedSkills.reduce((weakest, current) => {
            return current.value < weakest.value ? current : weakest;
          }, { name: "None", value: Infinity, level });
          break;
        }
      }
    }
    
    console.log("DEBUG - Final strongest skill:", strongestSkill);
    console.log("DEBUG - Final weakest skill:", weakestSkill);
    
    // Calculate skill deviations and imbalance score
    const skillDeviations = {};
    let totalDeviation = 0;
    
    Object.entries(skillLevels).forEach(([name, level]) => {
      const deviation = Math.abs(level - avgSkillLevel);
      skillDeviations[name] = deviation;
      totalDeviation += deviation;
    });
    
    // Calculate imbalance score (0-100)
    // Higher score means more imbalance
    const maxPossibleDeviation = avgSkillLevel * skillEntries.length;
    const imbalanceScore = maxPossibleDeviation > 0 
      ? Math.min(100, (totalDeviation / maxPossibleDeviation) * 100) 
      : 0;
    
    // Generate imbalance message
    let imbalanceMessage = "";
    if (imbalanceScore > 50) {
      imbalanceMessage = `Significant imbalance detected! Consider focusing on your ${weakestSkill.name} skill to improve balance.`;
    } else if (imbalanceScore > 20) {
      imbalanceMessage = `Moderate imbalance detected. Consider focusing on your ${weakestSkill.name} skill to improve balance.`;
    } else {
      imbalanceMessage = "Good balance between skills.";
    }
    
    return {
      avgSkillLevel,
      strongestSkill,
      weakestSkill,
      imbalanceScore,
      skillDeviations,
      imbalanceMessage
    };
  } catch (error) {
    console.error("Error getting skill imbalance analysis:", error);
    // Return default values on error
    return {
      avgSkillLevel: 0,
      strongestSkill: { name: "None", value: 0, level: 0 },
      weakestSkill: { name: "None", value: 0, level: 0 },
      imbalanceScore: 0,
      skillDeviations: {},
      imbalanceMessage: "Error analyzing skills."
    };
  }
};