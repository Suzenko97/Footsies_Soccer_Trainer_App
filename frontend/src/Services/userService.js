// src/services/userService.js
import { auth, db } from '../Config/firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore';

// Create a new user in Firestore
export const createUserProfile = async (uid, userData) => {
  try {
    const userRef = doc(db, "Users", uid);
    console.log("Creating Firestore document with:", { uid, userData });
    await setDoc(userRef, {
      email: userData.email,
      username: userData.username,
      skills: {
        dribbling: 0,
        shooting: 0,
        passing: 0,
        defending: 0,
        speed: 0,
        stamina: 0
      },
      skillLevels: {
        dribbling: 1,
        shooting: 1,
        passing: 1,
        defending: 1,
        speed: 1,
        stamina: 1
      },
      skillThresholds: {
        dribbling: 100,
        shooting: 100,
        passing: 100,
        defending: 100,
        speed: 100,
        stamina: 100
      },
      createdAt: new Date(),
      level: 1,
      xp: 0,
      xpThreshold: 100,
      phone: '',
      address: ''
    });
    console.log("Firestore document created successfully");
    return true;
  } catch (error) {
    console.error("Error creating user profile:", error);
    throw error;
  }
};

// Get user profile data
export const getUserProfile = async (uid) => {
  try {
    const userRef = doc(db, "Users", uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data();
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting user profile:", error);
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (uid, profileData) => {
  try {
    const userRef = doc(db, "Users", uid);
    await updateDoc(userRef, profileData);
    return true;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

// // Update the UID of a user document
// export const updateUserUid = async (tempUid, newUid) => {
//   try {
//     const userRef = doc(db, "Users", tempUid);
//     const newUserRef = doc(db, "Users", newUid);
//     const userDoc = await getDoc(userRef);

//     if (userDoc.exists()) {
//       // Copy the old document data to the new document
//       await setDoc(newUserRef, userDoc.data());
//       // Delete the old document
//       await deleteDoc(userRef);
//     }
//     return true;
//   } catch (error) {
//     console.error("Error updating user UID:", error);
//     throw error;
//   }
// };

// Check if username is available
export const isUsernameAvailable = async (username) => {
  try {
    const usersRef = collection(db, "Users");
    const q = query(usersRef, where("username", "==", username));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty; // Returns true if username is available
  } catch (error) {
    console.error("Error checking username availability:", error);
    throw error;
  }
};

// Update user skills
export const updateUserSkills = async (uid, skills, updatedSkillLevels, updatedSkillThresholds) => {
  try {
    const userRef = doc(db, "Users", uid);
    await updateDoc(userRef, { skills, skillLevels: updatedSkillLevels, skillThresholds: updatedSkillThresholds });
    return true;
  } catch (error) {
    console.error("Error updating user skills:", error);
    throw error;
  }
};

// Update user XP and level
export const updateUserProgress = async (uid, xp, level, xpThreshold) => {
  try {
    const userRef = doc(db, "Users", uid);
    await updateDoc(userRef, { xp, level, xpThreshold });
    return true;
  } catch (error) {
    console.error("Error updating user progress:", error);
    throw error;
  }
};

// Track a new training session with metrics
export const trackTrainingSession = async (uid, sessionData) => {
  try {
    const metricsRef = collection(db, "Users", uid, "metrics");
    const sessionWithTimestamp = {
      ...sessionData,
      timestamp: serverTimestamp(),
      date: new Date().toISOString().split('T')[0] // Store date in YYYY-MM-DD format
    };
    await addDoc(metricsRef, sessionWithTimestamp);
    
    // Update user's total sessions count
    const userRef = doc(db, "Users", uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const totalSessions = (userDoc.data().totalSessions || 0) + 1;
      await updateDoc(userRef, { 
        totalSessions,
        lastTrainingDate: sessionWithTimestamp.date
      });
    }
    
    return true;
  } catch (error) {
    console.error("Error tracking training session:", error);
    throw error;
  }
};

// Get user's training metrics history
export const getTrainingMetrics = async (uid, limit = 30) => {
  try {
    const metricsRef = collection(db, "Users", uid, "metrics");
    const q = query(metricsRef, orderBy("timestamp", "desc"), limit(limit));
    const querySnapshot = await getDocs(q);
    
    const metrics = [];
    querySnapshot.forEach((doc) => {
      metrics.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return metrics;
  } catch (error) {
    console.error("Error getting training metrics:", error);
    throw error;
  }
};

// Get metrics aggregated by date (for charts)
export const getAggregatedMetrics = async (uid, dateField = "date", metricField) => {
  try {
    const metrics = await getTrainingMetrics(uid, 100);
    
    // Group by date and calculate aggregates
    const aggregated = metrics.reduce((acc, metric) => {
      const date = metric[dateField];
      if (!acc[date]) {
        acc[date] = {
          date,
          count: 0,
          totalDuration: 0
        };
        
        // Initialize all metric fields with 0
        if (metricField) {
          acc[date][metricField] = 0;
        } else {
          // If no specific metric field, track all numeric fields
          Object.keys(metric).forEach(key => {
            if (typeof metric[key] === 'number' && key !== 'timestamp') {
              acc[date][key] = 0;
            }
          });
        }
      }
      
      // Increment counts and sums
      acc[date].count += 1;
      acc[date].totalDuration += metric.duration || 0;
      
      // Sum the metrics
      if (metricField && typeof metric[metricField] === 'number') {
        acc[date][metricField] += metric[metricField];
      } else {
        Object.keys(metric).forEach(key => {
          if (typeof metric[key] === 'number' && key !== 'timestamp' && acc[date][key] !== undefined) {
            acc[date][key] += metric[key];
          }
        });
      }
      
      return acc;
    }, {});
    
    // Convert to array and sort by date
    return Object.values(aggregated).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
  } catch (error) {
    console.error("Error getting aggregated metrics:", error);
    throw error;
  }
};