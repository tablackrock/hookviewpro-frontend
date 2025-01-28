// utils.ts

/**
 * Formats a Date object to a string in the format 'YYYY-MM-DD HH:mm:ss'
 * @param date - The Date object to format
 * @returns The formatted date string
 */
export function formatDateTime(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

//Format date to hourAgo or daysAgo
export function formatDateAgo(dateString: string) {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diff / (1000 * 60 * 60));
      if (diffDays > 0) {
        return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
      } else {
        return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
      }
    } catch {
      return "Invalid Date";
    }
  } 

  // Format date
  export function formatDate(dateString: string) {
    try {
      const options: Intl.DateTimeFormatOptions = {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      };
      return new Date(dateString).toLocaleDateString("en-US", options);
    } catch {
      return "Invalid Date";
    }
  };

/**
 * Capitalizes the first letter of a given string
 * @param value - The string to capitalize
 * @returns The string with the first letter capitalized
 */
export function capitalizeFirstLetter(value: string): string {
    if (!value) return value;
    return value.charAt(0).toUpperCase() + value.slice(1).toLocaleLowerCase();
}

//format number with 2 decimal places
export function formatNumber(num: number) {
  return num.toFixed(2);
}

//Uppercase first letter and lowercase remaining letters
export function formatStringLower(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

//check if supertrend is UP and alert direction is BUY , return status color

export function getSupertrendStatusColor(supertrend: string, alertDirection: string) {
  if (supertrend === "Up" && alertDirection.toUpperCase() === "BUY") {
    return "green";
  } else if (supertrend === "Down" && alertDirection.toUpperCase() === "SELL") {
    return "red";
  } else {
    return "gray";
  }
}

//check if supertrend is UP and superTrendDaily is UP, return status color
export function getSupertrendDailyStatusColor(supertrend: string, supertrendDaily: string) {
  if (supertrend === "Up" && supertrendDaily === "Up") {
    return "green";
  } else if (supertrend === "Down" && supertrendDaily === "Down") {
    return "red";
  } else {
    return "gray";
  }
}
