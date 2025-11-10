import { StyleSheet } from 'react-native'
import MapView, {Marker} from 'react-native-maps'

import Spacer from "../../components/Spacer"
import ThemedText from "../../components/ThemedText"
import ThemedView from "../../components/ThemedView"

const Map = () => {
  return (
    <ThemedView style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 37.78825,   // default latitude
          longitude: -122.4324, // default longitude
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {/* Example marker */}
        <Marker
          coordinate={{ latitude: 37.78825, longitude: -122.4324 }}
          title="You"
          description="Your current location"
        />
      </MapView>
    </ThemedView>
  );
};

export default Map

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map:{
    flex: 1,
  },
});