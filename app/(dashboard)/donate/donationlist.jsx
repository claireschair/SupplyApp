import { StyleSheet } from 'react-native'

import Spacer from "../../../components/Spacer"
import ThemedText from "../../../components/ThemedText"
import ThemedView from "../../../components/ThemedView"

const DonationList = () => {
  return (
    <ThemedView style={styles.container}>

      <ThemedText title={true} style={styles.heading}>
        Look through Supplies you would like to Donate
      </ThemedText>
      <Spacer />

    </ThemedView>
  )
}

export default DonationList

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