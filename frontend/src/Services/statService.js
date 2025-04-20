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
export const initializeSession = (options = {}) => {
  console.log("Initializing new training session with options:", options);
  currentSession = {
    startTime: new Date(),
    metrics: {},
    skillsChanged: [],
    totalDuration: 0,
    // Add new fields from Jean-Branch
    title: options.title || 'Training Session',
    skillsFocus: options.skillsFocus || 'general',
    intensity: options.intensity || 5,
    notes: options.notes || ''
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
      date: currentSession.date || timestamp.toDate().toISOString().split('T')[0],
      startTime: currentSession.customStartTime || Timestamp.fromDate(currentSession.startTime),
      endTime: timestamp,
      duration: currentSession.totalDuration,
      metrics: {...currentSession.metrics},
      skillsChanged: [...currentSession.skillsChanged],
      title: currentSession.title,
      skillsFocus: currentSession.skillsFocus,
      intensity: currentSession.intensity,
      notes: currentSession.notes
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
      date: doc.data().date || doc.data().timestamp.toDate().toISOString().split('T')[0],
      timestamp: doc.data().timestamp?.toDate() || new Date()
    }));
    
    // Calculate daily, weekly, and monthly counts
    const currentDate = new Date();
    const oneDayAgo = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const dailySessions = sessions.filter(session => {
      const sessionDate = new Date(session.timestamp);
      return sessionDate >= oneDayAgo;
    });
    
    // Create hourly breakdown for the last 24 hours
    const hourlyData = [];
    for (let i = 0; i < 24; i++) {
      const hourStart = new Date(currentDate.getTime() - (i + 1) * 60 * 60 * 1000);
      const hourEnd = new Date(currentDate.getTime() - i * 60 * 60 * 1000);
      
      const hourLabel = hourEnd.getHours() + ':00';
      
      const sessionsInHour = dailySessions.filter(session => {
        const sessionTime = new Date(session.timestamp);
        return sessionTime >= hourStart && sessionTime < hourEnd;
      });
      
      hourlyData.unshift({
        name: hourLabel,
        value: sessionsInHour.length
      });
    }
    
    const weeklySessions = sessions.filter(session => {
      const sessionDate = new Date(session.date);
      return sessionDate >= oneWeekAgo;
    });
    
    // Create daily breakdown for the last week
    const weeklyData = [];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(currentDate);
      dayStart.setDate(currentDate.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayName = dayNames[dayStart.getDay()];
      
      const sessionsInDay = sessions.filter(session => {
        const sessionTime = new Date(session.timestamp);
        return sessionTime >= dayStart && sessionTime <= dayEnd;
      });
      
      weeklyData.push({
        name: dayName,
        value: sessionsInDay.length
      });
    }
    
    const monthlySessions = sessions.filter(session => {
      const sessionDate = new Date(session.date);
      return sessionDate >= oneMonthAgo;
    });
    
    // Create daily breakdown for the last 30 days
    const monthlyData = [];
    
    for (let i = 29; i >= 0; i--) {
      const dayStart = new Date(currentDate);
      dayStart.setDate(currentDate.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);
      
      // Format as MM/DD
      const dayLabel = `${dayStart.getMonth() + 1}/${dayStart.getDate()}`;
      
      const sessionsInDay = sessions.filter(session => {
        const sessionTime = new Date(session.timestamp);
        return sessionTime >= dayStart && sessionTime <= dayEnd;
      });
      
      monthlyData.push({
        name: dayLabel,
        value: sessionsInDay.length
      });
    }
    
    // Create monthly breakdown for the entire year
    const yearlyData = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Get current month and year
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Loop through the last 12 months
    for (let i = 11; i >= 0; i--) {
      // Calculate the month and year we're looking at
      let monthIndex = currentMonth - i;
      let yearToUse = currentYear;
      
      // Adjust for previous year if needed
      if (monthIndex < 0) {
        monthIndex += 12;
        yearToUse -= 1;
      }
      
      // Create date ranges for the month
      const monthStart = new Date(yearToUse, monthIndex, 1, 0, 0, 0, 0);
      const monthEnd = new Date(yearToUse, monthIndex + 1, 0, 23, 59, 59, 999); // Last day of month
      
      const monthLabel = monthNames[monthIndex];
      
      const sessionsInMonth = sessions.filter(session => {
        const sessionTime = new Date(session.timestamp);
        return sessionTime >= monthStart && sessionTime <= monthEnd;
      });
      
      yearlyData.push({
        name: monthLabel,
        value: sessionsInMonth.length
      });
    }
    
    // Calculate average sessions per week over the last month
    const weekCount = Math.ceil(30 / 7);
    const avgSessionsPerWeek = monthlySessions.length / weekCount;
    
    // Create weekly breakdown for the last 4 weeks with date ranges
    const weeklyAverageData = [];
    
    for (let i = 0; i < 4; i++) {
      // Calculate week start and end dates
      const weekEndDate = new Date(currentDate);
      weekEndDate.setDate(currentDate.getDate() - (7 * (4 - i)));
      
      const weekStartDate = new Date(weekEndDate);
      weekStartDate.setDate(weekEndDate.getDate() - 6);
      
      // Format as MM/DD - MM/DD
      const weekLabel = `${weekStartDate.getMonth() + 1}/${weekStartDate.getDate()} - ${weekEndDate.getMonth() + 1}/${weekEndDate.getDate()}`;
      
      // Get sessions in this week
      const sessionsInWeek = sessions.filter(session => {
        const sessionTime = new Date(session.timestamp);
        return sessionTime >= weekStartDate && sessionTime <= weekEndDate;
      });
      
      // Calculate average per day for this week
      const avgPerDay = sessionsInWeek.length / 7;
      
      weeklyAverageData.unshift({
        name: weekLabel,
        value: Math.round(avgPerDay * 10) / 10 // Round to 1 decimal place
      });
    }
    
    return {
      totalSessions: sessions.length,
      dailySessions: dailySessions.length,
      weeklySessions: weeklySessions.length,
      monthlySessions: monthlySessions.length,
      avgSessionsPerWeek: avgSessionsPerWeek,
      hourlyData: hourlyData,
      weeklyData: weeklyData,
      monthlyData: monthlyData,
      yearlyData: yearlyData,
      weeklyAverageData: weeklyAverageData
    };
  } catch (error) {
    console.error("Error getting training frequency stats:", error);
    throw error;
  }
};

// Get the most recent training session
export const getLastTrainingSession = async (userId) => {
  try {
    const sessionsRef = collection(db, "Users", userId, "sessions");
    const q = query(sessionsRef, orderBy("timestamp", "desc"), limit(1));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const sessionDoc = querySnapshot.docs[0];
    const sessionData = sessionDoc.data();
    
    // Format the session data for display
    return {
      id: sessionDoc.id,
      date: sessionData.date || sessionData.timestamp.toDate().toISOString().split('T')[0],
      time: sessionData.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      duration: sessionData.duration || 0,
      metrics: sessionData.metrics || {},
      skillsChanged: sessionData.skillsChanged || [],
      title: sessionData.title || '',
      skillsFocus: sessionData.skillsFocus || '',
      intensity: sessionData.intensity || 0,
      notes: sessionData.notes || ''
    };
  } catch (error) {
    console.error("Error getting last training session:", error);
    return null;
  }
};

// Get skill progress over time
export const getSkillProgressStats = async (userId) => {
  try {
    console.log("Fetching skill progress stats for user:", userId);
    const sessionsRef = collection(db, "Users", userId, "sessions");
    
    // Get all sessions, ordered by timestamp
    const sessionsQuery = query(
      sessionsRef,
      orderBy("timestamp", "desc"),
      limit(30) // Get last 30 sessions for analysis
    );
    
    const sessionsSnapshot = await getDocs(sessionsQuery);
    const sessions = sessionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log("Retrieved sessions:", sessions.length);
    
    // Process sessions to get skill progress data
    const skillProgressData = {
      // For progress charts (used in line charts)
      monthlyProgress: [], // We'll keep the name for backward compatibility, but use daily data
      
      // For daily progress in the last week (used in skills tab)
      lastWeek: [],
      
      // For weekly progress in the last month
      lastMonth: [],
      
      // Raw session data
      sessions: sessions
    };
    
    // Always use daily grouping for more detailed charts
    console.log("Using daily grouping for all sessions");
    
    // Generate daily progress data
    const dailyData = {};
    
    // Get the date range - last 30 days
    const currentDate = new Date();
    const thirtyDaysAgo = new Date(currentDate);
    thirtyDaysAgo.setDate(currentDate.getDate() - 30);
    
    // Create empty data points for each day in the range
    for (let d = new Date(thirtyDaysAgo); d <= currentDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
      
      dailyData[dateStr] = {
        date: `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}`,
        fullDate: dateStr,
        month: d.toLocaleString('default', { month: 'short' }),
        day: d.getDate(),
        year: d.getFullYear(),
        dribbling: 0,
        shooting: 0,
        passing: 0,
        defending: 0,
        stamina: 0,
        speed: 0
      };
    }
    
    // Fill in the data from sessions
    sessions.forEach(session => {
      // Ensure session has a valid date
      if (!session.date) {
        console.log("Session missing date:", session.id);
        return;
      }
      
      const sessionDate = new Date(session.date);
      if (isNaN(sessionDate.getTime())) {
        console.log("Invalid date in session:", session.id, session.date);
        return;
      }
      
      // Skip sessions older than 30 days
      if (sessionDate < thirtyDaysAgo) {
        console.log("Skipping old session:", session.id, session.date);
        return;
      }
      
      const dayKey = session.date; // Use YYYY-MM-DD format
      
      // If we don't have this date in our data (shouldn't happen with the initialization above)
      if (!dailyData[dayKey]) {
        console.log("Creating missing date entry:", dayKey);
        dailyData[dayKey] = {
          date: `${sessionDate.toLocaleString('default', { month: 'short' })} ${sessionDate.getDate()}`,
          fullDate: dayKey,
          month: sessionDate.toLocaleString('default', { month: 'short' }),
          day: sessionDate.getDate(),
          year: sessionDate.getFullYear(),
          dribbling: 0,
          shooting: 0,
          passing: 0,
          defending: 0,
          stamina: 0,
          speed: 0
        };
      }
      
      // Add skill progress from this session
      if (session.metrics) {
        Object.entries(session.metrics).forEach(([skill, value]) => {
          if (dailyData[dayKey][skill] !== undefined) {
            dailyData[dayKey][skill] += value;
          }
        });
      } else {
        console.log("Session missing metrics:", session.id);
      }
    });
    
    // Convert to array and sort by date
    skillProgressData.monthlyProgress = Object.values(dailyData)
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        if (a.month !== b.month) {
          const monthA = new Date(Date.parse(`${a.month} 1, 2000`)).getMonth();
          const monthB = new Date(Date.parse(`${b.month} 1, 2000`)).getMonth();
          return monthA - monthB;
        }
        return a.day - b.day;
      });
    
    console.log("Progress data processed:", skillProgressData.monthlyProgress.length, "data points");
    
    // Generate last week data (daily)
    const weekStartDate = new Date();
    const lastWeekDates = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStartDate);
      date.setDate(weekStartDate.getDate() - (6 - i));
      return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    });
    
    // Create a map for days of the week
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Initialize last week data with zeros
    skillProgressData.lastWeek = lastWeekDates.map(date => {
      const dayDate = new Date(date);
      return {
        date: daysOfWeek[dayDate.getDay()],
        fullDate: date,
        minutes: 0,
        skills: {
          dribbling: 0,
          shooting: 0,
          passing: 0,
          defending: 0,
          stamina: 0,
          speed: 0
        }
      };
    });
    
    // Fill in last week data from sessions
    sessions.forEach(session => {
      const sessionDate = session.date;
      const dayIndex = lastWeekDates.indexOf(sessionDate);
      
      if (dayIndex !== -1) {
        // Add duration
        skillProgressData.lastWeek[dayIndex].minutes += session.duration || 0;
        
        // Add skill progress
        if (session.metrics) {
          Object.entries(session.metrics).forEach(([skill, value]) => {
            if (skillProgressData.lastWeek[dayIndex].skills[skill] !== undefined) {
              skillProgressData.lastWeek[dayIndex].skills[skill] += value;
            }
          });
        } else {
          console.log("Session missing metrics:", session.id);
        }
      }
    });
    
    // Generate last month data (weekly)
    const lastMonthWeeks = Array.from({ length: 4 }, (_, i) => {
      const startDate = new Date(weekStartDate);
      startDate.setDate(weekStartDate.getDate() - (7 * (4 - i)));
      
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      
      return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        week: `Week ${i + 1}`
      };
    });
    
    // Initialize last month data with zeros
    skillProgressData.lastMonth = lastMonthWeeks.map(week => ({
      week: week.week,
      startDate: week.startDate,
      endDate: week.endDate,
      minutes: 0,
      skills: {
        dribbling: 0,
        shooting: 0,
        passing: 0,
        defending: 0,
        stamina: 0,
        speed: 0
      }
    }));
    
    // Fill in last month data from sessions
    sessions.forEach(session => {
      const sessionDate = session.date;
      
      // Find which week this session belongs to
      const weekIndex = lastMonthWeeks.findIndex(
        week => sessionDate >= week.startDate && sessionDate <= week.endDate
      );
      
      if (weekIndex !== -1) {
        // Add duration
        skillProgressData.lastMonth[weekIndex].minutes += session.duration || 0;
        
        // Add skill progress
        if (session.metrics) {
          Object.entries(session.metrics).forEach(([skill, value]) => {
            if (skillProgressData.lastMonth[weekIndex].skills[skill] !== undefined) {
              skillProgressData.lastMonth[weekIndex].skills[skill] += value;
            }
          });
        } else {
          console.log("Session missing metrics:", session.id);
        }
      }
    });
    
    return skillProgressData;
  } catch (error) {
    console.error("Error getting skill progress stats:", error);
    // Return empty data on error
    return {
      monthlyProgress: [],
      lastWeek: [],
      lastMonth: [],
      sessions: []
    };
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
    
    const skills = ['dribbling', 'shooting', 'passing', 'stamina'];
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

// Add a new function to create a session from manual form data
export const createSessionFromFormData = async (userId, formData) => {
  console.log("Creating session from form data:", formData);
  
  // Parse the date from the form
  const sessionDate = formData.date ? new Date(formData.date) : new Date();
  
  // Set the time to noon on the selected date to avoid timezone issues
  sessionDate.setHours(12, 0, 0, 0);
  
  // First initialize a session if one doesn't exist
  if (!currentSession) {
    initializeSession({
      title: formData.title || 'Training Session',
      skillsFocus: formData.skillsFocus || 'general',
      intensity: formData.intensity || 5,
      notes: formData.notes || ''
    });
  }
  
  // Add the custom date to the session
  currentSession.date = formData.date;
  currentSession.customStartTime = Timestamp.fromDate(sessionDate);
  
  // Map form data to session metrics
  const skillsToUpdate = ['dribbling', 'shooting', 'passing', 'stamina', 'speed', 'defending'];
  
  skillsToUpdate.forEach(skill => {
    if (formData[skill] > 0) {
      // Convert the rating (0-10) to an XP value
      const xpGained = formData[skill] * 10; // Simple conversion
      
      // Record this skill training in the current session
      recordSkillTraining(skill, xpGained, formData.duration);
    }
  });
  
  // Save the session
  return await saveCurrentSession(userId);
};

// Data migration utility to convert between formats
export const migrateMetricsToSessions = async (userId) => {
  try {
    // Get metrics data (Jean-Branch format)
    const metricsRef = collection(db, "Users", userId, "metrics");
    const metricsSnapshot = await getDocs(metricsRef);
    
    // Get sessions data (Najee-Branch format)
    const sessionsRef = collection(db, "Users", userId, "sessions");
    
    // For each metric, create a corresponding session
    for (const metricDoc of metricsSnapshot.docs) {
      const metricData = metricDoc.data();
      
      // Convert metric format to session format
      const sessionData = {
        timestamp: metricData.timestamp,
        date: metricData.date,
        startTime: metricData.timestamp,
        endTime: metricData.timestamp,
        duration: metricData.duration || 0,
        metrics: {},
        skillsChanged: [],
        title: metricData.title || 'Imported Session',
        notes: metricData.notes || '',
        intensity: metricData.intensity || 5
      };
      
      // Convert skill ratings to metrics
      ['dribbling', 'shooting', 'passing', 'stamina'].forEach(skill => {
        if (metricData[skill] > 0) {
          sessionData.metrics[skill] = metricData[skill] * 10; // Convert rating to XP
          sessionData.skillsChanged.push(skill);
        }
      });
      
      // Add to sessions collection
      await addDoc(sessionsRef, sessionData);
    }
    
    return true;
  } catch (error) {
    console.error("Error migrating metrics to sessions:", error);
    return false;
  }
};