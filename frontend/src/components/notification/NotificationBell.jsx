import React, { useState, useRef, useEffect } from "react";
import { useNotifications } from "../../context/NotificationContext";
import {  formatDistanceToNow } from "date-fns";
import { authServices } from "../../auth";

export const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    notifications = [],
    unreadCount,
    loading = false,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
  } = useNotifications();
  const dropdownRef = useRef(null);
  const currentUser = authServices.getAuthUser();
  const formatMessage = (message) => {
    return message.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  };
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="p-8 text-center text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2">Loading notifications...</p>
        </div>
      );
    }

    if (
      !Array.isArray(notifications?.notifications) ||
      notifications?.notifications.length === 0
    ) {
      return (
        <div className="p-8 text-center text-gray-500">
          <p>No notifications yet</p>
        </div>
      );
    }

    return notifications?.notifications?.map((notification) => (
      <div
        key={notification._id}
        className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
          !notification.read.some((r) => r.userId === currentUser?._id)
            ? "bg-blue-50"
            : ""
        }`}
      >
        <div className="flex gap-3">
          <div className="flex-1">
            <p
              className="text-sm text-gray-800"
              dangerouslySetInnerHTML={{
                __html: formatMessage(notification.message),
              }}
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(notification.createdAt), {
                  addSuffix: true,
                })}
              </p>
              <div className="flex gap-2">
                {!notification.read.some(
                  (r) => r.userId === currentUser?._id
                ) && (
                  <button
                    onClick={() => markAsRead(notification._id)}
                    className="text-xs text-blue-500 hover:text-blue-700"
                  >
                    Mark as read
                  </button>
                )}
                <button
                  onClick={() => removeNotification(notification._id)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    ));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative inline-flex items-center justify-center p-2 text-gray-600 hover:text-blue-500 transition-colors"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl z-50">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-semibold">Notifications</h3>
            {notifications?.notifications?.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-500 hover:text-blue-700"
                >
                  Mark all as read
                </button>
                <button
                  onClick={clearAllNotifications}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
          <div className="max-h-[400px] overflow-y-auto">{renderContent()}</div>
        </div>
      )}
    </div>
  );
};
