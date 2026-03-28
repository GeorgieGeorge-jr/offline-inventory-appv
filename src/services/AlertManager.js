import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { getUnreadAlerts, markAlertAsRead } from "./dataService";
import { sendLocalNotification } from "./notificationService";

export const AlertManager = () => {
  const user = useSelector((state) => state.auth.user);
  const intervalRef = useRef(null);
  const isCheckingRef = useRef(false);

  useEffect(() => {
    if (!user || user.role !== "admin") return;

    const checkAlerts = async () => {
      if (isCheckingRef.current) return;

      try {
        isCheckingRef.current = true;

        const alerts = await getUnreadAlerts(10);

        for (const alert of alerts) {
          await sendLocalNotification({
            title: alert.title,
            body: alert.message,
          });

          await markAlertAsRead(alert.id);
        }
      } catch (error) {
        console.error("Alert manager error:", error);
      } finally {
        isCheckingRef.current = false;
      }
    };

    checkAlerts();
    intervalRef.current = setInterval(checkAlerts, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user]);

  return null;
};