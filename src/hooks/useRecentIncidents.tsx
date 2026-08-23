import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { isIncidentCategoryId } from "@/constants/incident-categories";
import { firestore } from "@/src/config/firebase";
import type {
  Incident,
  IncidentCoordinates,
  IncidentStatus,
} from "@/src/types/incident";

const RECENT_INCIDENT_LIMIT = 50;

function isIncidentStatus(
  value: unknown,
): value is IncidentStatus {
  return (
    value === "active" ||
    value === "resolved" ||
    value === "removed"
  );
}

function getCoordinates(
  value: unknown,
): IncidentCoordinates | null {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return null;
  }

  const coordinates = value as {
    latitude?: unknown;
    longitude?: unknown;
  };

  if (
    typeof coordinates.latitude !== "number" ||
    typeof coordinates.longitude !== "number"
  ) {
    return null;
  }

  return {
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
  };
}

function mapIncidentDocument(
  id: string,
  data: Record<string, unknown>,
): Incident | null {
  if (!isIncidentCategoryId(data.type)) {
    console.warn(
      `Incident ${id} has an unsupported incident type.`,
    );

    return null;
  }

  const coordinates = getCoordinates(
    data.coordinates,
  );

  if (!coordinates) {
    console.warn(
      `Incident ${id} has invalid coordinates.`,
    );

    return null;
  }

  return {
    id,
    type: data.type,

    description:
      typeof data.description === "string"
        ? data.description
        : "",

    coordinates,

    anonymous:
      typeof data.anonymous === "boolean"
        ? data.anonymous
        : true,

    status: isIncidentStatus(data.status)
      ? data.status
      : "active",

    creatorUid:
      typeof data.creatorUid === "string"
        ? data.creatorUid
        : "",

    createdAt:
      data.createdAt instanceof Timestamp
        ? data.createdAt
        : null,
  };
}

export function useRecentIncidents() {
  const [incidents, setIncidents] =
    useState<Incident[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [refreshKey, setRefreshKey] =
    useState(0);

  const retry = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    const incidentsReference =
      collection(
        firestore,
        "incidents",
      );

    const incidentsQuery = query(
      incidentsReference,
      orderBy(
        "createdAt",
        "desc",
      ),
      limit(RECENT_INCIDENT_LIMIT),
    );

    const unsubscribe = onSnapshot(
      incidentsQuery,

      (snapshot) => {
        const retrievedIncidents =
          snapshot.docs
            .map((documentSnapshot) =>
              mapIncidentDocument(
                documentSnapshot.id,
                documentSnapshot.data(),
              ),
            )
            .filter(
              (
                incident,
              ): incident is Incident =>
                incident !== null,
            );

        setIncidents(
          retrievedIncidents,
        );

        setError(null);
        setIsLoading(false);
      },

      (snapshotError) => {
        console.error(
          "Recent incidents retrieval error:",
          snapshotError,
        );

        setIncidents([]);

        setError(
          "SafeHer could not load recent incidents. Check your connection and try again.",
        );

        setIsLoading(false);
      },
    );

    return unsubscribe;
  }, [refreshKey]);

  return {
    incidents,
    isLoading,
    error,
    retry,
  };
}

