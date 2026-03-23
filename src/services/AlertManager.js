import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import {
  getUnreadAlerts,
  markAlertAsRead,
} from "./dataService";
import { sendLocalNotification } from "./notificationService";

export const AlertManager = () => {
  const user = useSelector((state) => state.auth.user);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!user || user.role !== "admin") return;

    const checkAlerts = async () => {
      try {
        const alerts = await getUnreadAlerts(5);

        for (const alert of alerts) {
          await sendLocalNotification({
            title: alert.title,
            body: alert.message,
          });

          await markAlertAsRead(alert.id);
        }
      } catch (error) {
        console.error("Alert manager error:", error);
      }
    };

    // run immediately
    checkAlerts();

    // then poll every 8 seconds
    intervalRef.current = setInterval(checkAlerts, 8000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [user]);

  return null;
};