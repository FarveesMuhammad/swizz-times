import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from "date-fns";

const createDateFilter = (filter, startDate, endDate) => {
    let dateFilter = {};

    switch (filter) {
        case "daily":
            dateFilter.createdAt = {
                $gte: startOfDay(new Date()),
                $lte: endOfDay(new Date()),
            };
            break;
        case "weekly":
            dateFilter.createdAt = {
                $gte: startOfWeek(new Date(), { weekStartsOn: 1 }), // Monday start
                $lte: endOfWeek(new Date(), { weekStartsOn: 1 }),
            };
            break;
        case "monthly":
            dateFilter.createdAt = {
                $gte: startOfMonth(new Date()),
                $lte: endOfMonth(new Date()),
            };
            break;
        case "custom":
            if (startDate && endDate) {
                dateFilter.createdAt = {
                    $gte: startOfDay(parseISO(startDate)),
                    $lte: endOfDay(parseISO(endDate)),
                };
            } else {
                // Fallback to daily if custom dates are missing
                dateFilter.createdAt = {
                    $gte: startOfDay(new Date()),
                    $lte: endOfDay(new Date()),
                };
            }
            break;
        default:
            // Default to daily instead of no filter
            dateFilter.createdAt = {
                $gte: startOfDay(new Date()),
                $lte: endOfDay(new Date()),
            };
            break;
    }

    return dateFilter;
};

export default createDateFilter;