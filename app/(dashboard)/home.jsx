import { View, Image, StyleSheet, Dimensions } from 'react-native'
import Spacer from "../../components/Spacer"
import ThemedText from "../../components/ThemedText"
import ThemedView from "../../components/ThemedView"
import ThemedLogo from "../../components/ThemedLogo"
const {width, height } = Dimensions.get('window')

const Home = () => {
  return (
    <ThemedView style={styles.container}>
      <View style ={styles.topBackground} />
      <View style={styles.circleBackground} />
      <View style={styles.header}>
        <Spacer />
        <ThemedLogo />
        <ThemedText title style={styles.heading}>
          Reserved
        </ThemedText>
      <ThemedText style={styles.subheading}>
        Our Mission
      </ThemedText>
      <ThemedText style={styles.paragraph}>
        We aim to create a simple and reliable blah blah blah and help one another through yes yes yes 
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
  topBackground: {
    position: "absolute",
    top: 0,
    width: "100%",
    height: "50%", // top half is blue
    backgroundColor: "#4A90E2",
    zIndex: 0,
  },
  circleBackground: { //Circle 
    position: 'absolute',
    top: 160,
    left: -width*0.15,
    width: width*1.3,
    height: 475,
    backgroundColor: '#f8f9fa',
    borderRadius: 350,
    zIndex: 0, 
  },
  header: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 30,
  },
  heading: {
    fontWeight: 'bold',
    fontSize: 40,
    color: 'black',
    textAlign: 'center',
    marginTop: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subheading: {
    fontSize: 22,
    fontWeight: '600',
    color: '#4A90E2',
    marginTop: 20,
    textAlign: 'center',
  },
  paragraph: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    paddingHorizontal: 40,
    marginTop: 6,
    lineHeight: 22,
  },
})
