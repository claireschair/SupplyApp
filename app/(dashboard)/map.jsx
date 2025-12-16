import { StyleSheet } from 'react-native'
import { useEffect, useState } from 'react'
import MapView, { Marker } from 'react-native-maps'
import * as Location from 'expo-location'

import ThemedView from "../../components/ThemedView"

const Map = () => {
  const [location, setLocation] = useState(null)

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        console.log('Permission denied')
        return
      }

      const userLocation = await Location.getCurrentPositionAsync({})
      setLocation(userLocation.coords)
    })()
  }, [])

  return (
    <ThemedView style={styles.container}>
      <MapView
        style={styles.map}
        region={
          location && {
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }
        }
        showsUserLocation
      >
        {location && (
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title="You"
          />
        )}
      </MapView>
    </ThemedView>
  )
}

export default Map

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
})
