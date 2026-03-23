import * as Notifications from "expo-notifications";

export async function requestNotificationPermission() {
  const { status } = await Notifications.requestPermissionsAsync();

  if (status !== "granted") {
    console.log("Notification permission not granted");
    return false;
  }

  return true;
}

export async function sendLocalNotification({ title, body }) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
    },
    trigger: null, // immediate
  });
}