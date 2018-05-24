import React from 'react';
import plur from 'plur';

const SECOND = 1000;
const MINUTE = SECOND * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;

const getMessage = createdAt => {
  const now = Date.now();
  const time = new Date(+createdAt).getTime();

  const difference = now - time;

  if (difference / MINUTE < 1) {
    return 'less than a minute ago';
  } else if (difference / HOUR < 1) {
    const minutes = Math.floor(difference / MINUTE);
    return `${minutes} ${plur('minute', minutes)} ago`;
  } else if (difference / DAY < 1) {
    const hours = Math.floor(difference / HOUR);
    return `${hours} ${plur('hour', hours)} ago`;
  } else {
    const days = Math.floor(difference / DAY);
    return `${days} ${plur('day', days)} ago`;
  }
};

export default ({ className, createdAt }) => (
  <span className={className}>{getMessage(createdAt)}</span>
);
