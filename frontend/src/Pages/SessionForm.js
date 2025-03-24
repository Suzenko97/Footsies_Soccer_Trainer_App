import React, { useState } from 'react';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

function SessionForm(props) {
  const playerId = props.playerId;
  const [date, setDate] = useState('');
  const [sessionType, setSessionType] = useState('');
  const [duration, setDuration] = useState('');
  const [speed, setSpeed] = useState('');
  // ...add other metric states as needed

  const db = getFirestore();

  const handleSubmit = async function(e) {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'players', playerId, 'sessions'), {
        date: date,
        sessionType: sessionType,
        duration: Number(duration),
        metrics: {
          speed: Number(speed)
          // add other metrics here
        }
      });
      // Optionally clear the form or display success feedback
    } catch (err) {
      console.error("Error adding document: ", err);
    }
  };

  return React.createElement(
    'form',
    { onSubmit: handleSubmit },
    React.createElement('input', {
      type: 'date',
      value: date,
      onChange: function(e) { setDate(e.target.value); },
      required: true
    }),
    // You can add additional input elements here for sessionType, duration, etc.
    React.createElement(
      'button',
      { type: 'submit' },
      'Log Session'
    )
  );
}

export default SessionForm;
