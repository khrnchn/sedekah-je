import { type Institution } from "@/db/schema";

/**
 * Returns the appropriate status icon based on the provided status.
 * @param deliveryStatus - The delivery status of the institution.
 * @returns A React component representing the status icon.
 */
// export function getDeliveryStatusIcon(deliveryStatus: Institution["deliveryStatus"]) {
//   const statusIcons = {
//     "PENDING": Clock,           // Clock icon suggests waiting/initial state
//     "PREPARING": Package,       // Package icon represents institution being prepared
//     "PREPARED": CheckCircle2,   // Checkmark circle indicates ready state
//     "IN_TRANSIT": Truck,        // Truck icon for delivery in progress
//     "DELIVERED": MapPin,        // Map pin suggests successful delivery
//     "COMPLETED": CheckCheck,    // Double checkmark for final completion
//     "DELIVERY_FAILED": XCircle, // X circle for failed delivery
//     "RETURNING": Repeat,        // Repeat icon for return process
//     "RETURNED": RotateCcw,      // Rotate counter-clockwise for returned
//     "REDELIVERY": RefreshCw     // Refresh clockwise for redelivery attempt
//   }

//   return statusIcons[deliveryStatus] || Clock // Default to Clock if status not found
// } 

export type BadgeColors = {
  background: string;
  text: string;
};

export function getCategoryColors(
  category: Institution["categoryId"],
): BadgeColors {
  const categoryColors: Record<Institution["categoryId"], BadgeColors> = {
    1: {
      background:
        "bg-yellow-100 dark:bg-yellow-900 hover:bg-yellow-200 dark:hover:bg-yellow-800",
      text: "text-yellow-800 dark:text-yellow-200",
    },
    2: {
      background:
        "bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800",
      text: "text-blue-800 dark:text-blue-200",
    },
    3: {
      background:
        "bg-purple-100 dark:bg-purple-900 hover:bg-purple-200 dark:hover:bg-purple-800",
      text: "text-purple-800 dark:text-purple-200",
    },
    4: {
      background:
        "bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800",
      text: "text-green-800 dark:text-green-200",
    },
    5: {
      background:
        "bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800",
      text: "text-red-800 dark:text-red-200",
    },
    6: {
      background:
        "bg-orange-100 dark:bg-orange-900 hover:bg-orange-200 dark:hover:bg-orange-800",
      text: "text-orange-800 dark:text-orange-200",
    },
  };

  return (
    categoryColors[category] || {
      background:
        "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700",
      text: "text-gray-800 dark:text-gray-200",
    }
  );
}