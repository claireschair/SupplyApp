import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import ThemedText from "../../../components/ThemedText";
import * as Location from "expo-location";
import { useEffect, useState } from "react";


const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

const PlaceSearchInput = ({ onSelect }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") return;

      const loc = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    })();
  }, []);



  //console.log("Mapbox token:", MAPBOX_TOKEN);


  const searchPlaces = async (text) => {
  setQuery(text);

  if (text.length < 3) {
    setResults([]);
    return;
  }

  const proximity =
    userLocation
      ? `&proximity=${userLocation.longitude},${userLocation.latitude}`
      : "";

  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        text
      )}.json?access_token=${MAPBOX_TOKEN}&types=poi,address&limit=5${proximity}`
    );

    const data = await res.json();
    setResults(data.features || []);
  } catch (err) {
    console.log("Autocomplete error", err);
  }
};



  return (
    <View style={styles.wrapper}>
      <TextInput
        style={styles.input}
        placeholder="Search for a place"
        value={query}
        onChangeText={searchPlaces}
      />

      {results.length > 0 && (
        <View style={styles.resultsContainer}>
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.result}
                onPress={() => {
                  setQuery(item.place_name);
                  setResults([]);
                  onSelect({
                    name: item.text,
                    latitude: item.center[1],
                    longitude: item.center[0],
                  });
                }}
              >
                <ThemedText>{item.place_name}</ThemedText>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
};

export default PlaceSearchInput;

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    zIndex: 1000, // 👈 REQUIRED
  },
  input: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "white",
  },
  resultsContainer: {
    position: "absolute",
    top: 50,
    width: "100%",
    backgroundColor: "white",
    borderRadius: 10,
    maxHeight: 200,
    zIndex: 1001,
    elevation: Platform.OS === "android" ? 10 : 0,
  },
  result: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
});
