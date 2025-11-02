import { StyleSheet } from 'react-native'

import Spacer from "../../components/Spacer"
import ThemedText from "../../components/ThemedText"
import ThemedView from "../../components/ThemedView"

const Donate = () => {
  return (
    <ThemedView style={styles.container}>

      <ThemedText title={true} style={styles.heading}>
        Donate School Supplies
      </ThemedText>
      <Spacer />

    </ThemedView>
  )
}

export default Donate

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  heading: {
    fontWeight: "bold",
    fontSize: 18,
    textAlign: "center",
  },
})