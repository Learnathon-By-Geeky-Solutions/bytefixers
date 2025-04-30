import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import { authServices } from "../auth";
import propTypes from "prop-types";
const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const currentUser = authServices.getAuthUser();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const fetchNotifications = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/api/notifications/user/${currentUser._id}`
      );
      if (!response.ok) throw new Error("Failed to fetch notifications");
      const data = await response.json();
      setNotifications(data);
      const unreadCount =
        data.notifications?.filter(
          (notification) =>
            !notification.read.some((r) => r.userId === currentUser?._id)
        ).length || 0;
      setUnreadCount(unreadCount);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch notifications periodically
  useEffect(() => {
    if (currentUser?._id) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [currentUser?._id]);

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/api/notifications/${notificationId}/read`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: currentUser._id }),
        }
      );
      if (!response.ok) throw new Error("Failed to mark notification as read");
      await fetchNotifications(); // Refresh notifications
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };
  const markAllAsRead = async () => {
    try {
      if (!currentUser?._id) return;

      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/api/notifications/mark-all-read`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: currentUser._id }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to mark all notifications as read");
      }

      // Update notifications state properly
      setNotifications((prev) => ({
        ...prev,
        notifications: prev.notifications.map((notification) => ({
          ...notification,
          read: [
            ...notification.read,
            { userId: currentUser._id, readAt: new Date() },
          ],
        })),
      }));

      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };
  const removeNotification = async (notificationId) => {
    try {
      if (!currentUser?._id) return;

      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/api/notifications/${notificationId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: currentUser._id }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to remove notification");
      }

      // Update local state by removing the notification for current user only
      setNotifications((prev) => ({
        ...prev,
        notifications: prev.notifications.filter(
          (n) => n._id !== notificationId
        ),
      }));

      // Update unread count if needed
      const wasUnread = notifications?.notifications?.find(
        (n) =>
          n._id === notificationId &&
          !n.read.some((r) => r.userId === currentUser?._id)
      );
      if (wasUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error removing notification:", error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      if (!currentUser?._id) return;

      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/api/notifications/clear-all`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: currentUser._id }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to clear all notifications");
      }

      // Reset notifications state for current user
      setNotifications({
        ...notifications,
        notifications: [],
      });
      setUnreadCount(0);

      // Fetch fresh notifications in case there are new ones
      await fetchNotifications();
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  };

  // Add this after fetchNotifications function
  const addNotification = async (notification) => {
    try {
      if (!currentUser?._id) return;

      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...notification,
          userId: currentUser._id,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add notification");
      }

      // Refresh notifications to get the new one
      await fetchNotifications();
    } catch (error) {
      console.error("Error adding notification:", error);
    }
  };

  // Update your useEffect to calculate unreadCount
  useEffect(() => {
    if (notifications?.notifications?.length > 0) {
      const count = notifications.notifications.filter(
        (notification) =>
          !notification.read.some((r) => r.userId === currentUser?._id)
      ).length;
      setUnreadCount(count);
    } else {
      setUnreadCount(0);
    }
  }, [notifications, currentUser?._id]);

  return (
    <NotificationContext.Provider
      value={useMemo(
        () => ({
          notifications,
          unreadCount,
          loading,
          addNotification,
          markAsRead,
          markAllAsRead,
          removeNotification,
          clearAllNotifications,
          refreshNotifications: fetchNotifications,
        }),
        [
          notifications,
          unreadCount,
          loading,
          addNotification,
          markAsRead,
          markAllAsRead,
          removeNotification,
          clearAllNotifications,
          fetchNotifications,
        ]
      )}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);

NotificationProvider.propTypes = {
  children: propTypes.node.isRequired,
};
