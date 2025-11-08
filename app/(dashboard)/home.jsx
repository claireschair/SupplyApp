import { View, Image, StyleSheet } from 'react-native'
import Spacer from "../../components/Spacer"
import ThemedText from "../../components/ThemedText"
import ThemedView from "../../components/ThemedView"
import ThemedLogo from "../../components/ThemedLogo"

const Home = () => {
  return (
    <ThemedView style={styles.container}>
      
      <View style={styles.header}>
        <Spacer />
        <ThemedLogo />
        <ThemedText title style={styles.heading}>
          Reserved
        </ThemedText>
      </View>



      <View style={styles.content}>
        <ThemedText>Welcome!</ThemedText>
      </View>

    </ThemedView>
  )
}

export default Home

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    width: '100%',
    height: 250,
    backgroundColor: '#4A90E2',
    borderBottomLeftRadius: 250,
    borderBottomRightRadius: 250,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 30,
  },
  heading: {
    fontWeight: 'bold',
    fontSize: 20,
    color: 'white',
    textAlign: 'center',
    marginTop: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
