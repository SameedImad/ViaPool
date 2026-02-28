import { Client } from "@googlemaps/google-maps-services-js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const client = new Client({});

const autocompleteAddress = asyncHandler(async (req, res) => {
    const { input } = req.query;

    if (!input) {
        throw new ApiError(400, "Search input is required");
    }

    try {
        const response = await client.placeAutocomplete({
            params: {
                input,
                key: process.env.GOOGLE_MAPS_API_KEY,
            },
            timeout: 1000, // milliseconds
        });

        res.status(200).json(new ApiResponse(200, response.data.predictions, "Autocomplete suggestions fetched successfully"));
    } catch (error) {
        throw new ApiError(500, error.response?.data?.error_message || "Error fetching from Google Maps API");
    }
});

const getDistanceAndDuration = asyncHandler(async (req, res) => {
    const { origin, destination } = req.query; // Expecting place IDs or lat,lng strings

    if (!origin || !destination) {
        throw new ApiError(400, "Origin and destination are required");
    }

    try {
        const response = await client.distancematrix({
            params: {
                origins: [origin],
                destinations: [destination],
                key: process.env.GOOGLE_MAPS_API_KEY,
            },
            timeout: 1000,
        });

        if (response.data.rows[0].elements[0].status === "ZERO_RESULTS") {
            throw new ApiError(404, "No route found between these locations");
        }

        const distance = response.data.rows[0].elements[0].distance.value; // in meters
        const duration = response.data.rows[0].elements[0].duration.value; // in seconds

        res.status(200).json(new ApiResponse(200, { distance, duration }, "Distance and duration fetched successfully"));
    } catch (error) {
        throw new ApiError(500, error.response?.data?.error_message || "Error calculating distance via Google Maps API");
    }
});

export {
    autocompleteAddress,
    getDistanceAndDuration
};
