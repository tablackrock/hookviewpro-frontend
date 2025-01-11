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

/**
 * Capitalizes the first letter of a given string
 * @param value - The string to capitalize
 * @returns The string with the first letter capitalized
 */
export function capitalizeFirstLetter(value: string): string {
    if (!value) return value;
    return value.charAt(0).toUpperCase() + value.slice(1);
}