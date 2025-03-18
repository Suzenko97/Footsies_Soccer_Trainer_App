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
  deleteDoc
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
      xpThreshold: 100
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