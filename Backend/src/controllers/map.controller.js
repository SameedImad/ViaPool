import axios from "axios";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Uses Nominatim (OpenStreetMap) for geocoding/autocomplete
const autocompleteAddress = asyncHandler(async (req, res) => {
    const { input } = req.query;

    if (!input) {
        throw new ApiError(400, "Search input is required");
    }

    try {
        const response = await axios.get("https://nominatim.openstreetmap.org/search", {
            params: {
                q: input,
                format: "json",
                addressdetails: 1,
                limit: 5,
            },
            headers: {
                "User-Agent": "ViaPool/1.0" // Nominatim requires a User-Agent
            },
            timeout: 5000,
        });

        const predictions = response.data.map((place) => ({
            description: place.display_name,
            place_id: place.place_id,
            location: {
                lat: parseFloat(place.lat),
                lng: parseFloat(place.lon)
            }
        }));

        res.status(200).json(new ApiResponse(200, predictions, "Autocomplete suggestions fetched successfully via OSM"));
    } catch (error) {
        throw new ApiError(500, error.message || "Error fetching from OpenStreetMap API");
    }
});

// Uses OSRM (Open Source Routing Machine) public API for distance and duration
const getDistanceAndDuration = asyncHandler(async (req, res) => {
    // Expecting origin and destination in format "lng,lat"
    const { origin, destination } = req.query;

    if (!origin || !destination) {
        throw new ApiError(400, "Origin and destination are required in format 'lng,lat'");
    }

    try {
        const response = await axios.get(`https://router.project-osrm.org/route/v1/driving/${origin};${destination}`, {
            params: {
                overview: "false",
            },
            timeout: 5000,
        });

        if (response.data.code !== "Ok") {
            throw new ApiError(404, "No route found between these locations via OSRM");
        }

        const distance = response.data.routes[0].distance; // in meters
        const duration = response.data.routes[0].duration; // in seconds

        res.status(200).json(new ApiResponse(200, { distance, duration }, "Distance and duration fetched successfully via OSRM"));
    } catch (error) {
        throw new ApiError(500, error.message || "Error calculating distance via OSRM API");
    }
});

const getRouteGeometry = asyncHandler(async (req, res) => {
    const { origin, destination } = req.query;

    if (!origin || !destination) {
        throw new ApiError(400, "Origin and destination are required in format 'lng,lat'");
    }

    try {
        const response = await axios.get(`https://router.project-osrm.org/route/v1/driving/${origin};${destination}`, {
            params: {
                overview: "full",
                geometries: "geojson"
            },
            timeout: 5000,
        });

        if (response.data.code !== "Ok" || !response.data.routes?.length) {
            throw new ApiError(404, "No route found between these locations via OSRM");
        }

        const route = response.data.routes[0];
        const path = route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));

        res.status(200).json(
            new ApiResponse(
                200,
                {
                    distance: route.distance,
                    duration: route.duration,
                    path
                },
                "Route geometry fetched successfully via OSRM"
            )
        );
    } catch (error) {
        throw new ApiError(500, error.message || "Error fetching route geometry via OSRM");
    }
});

export {
    autocompleteAddress,
    getDistanceAndDuration,
    getRouteGeometry
};
