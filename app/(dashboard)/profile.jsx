import { StyleSheet, View, Image, Dimensions } from 'react-native'
import ThemedLogo from "../../components/ThemedLogo"
import ThemedText from "../../components/ThemedText"
import ThemedView from "../../components/ThemedView"
import Spacer from "../../components/Spacer"

// Replace with your actual logo import
import Logo from '../../assets/logo/logo_light.png'
const { width, height } = Dimensions.get('window')

const Profile = () => {
  return (
    <ThemedView style={styles.container}>
      <View style={styles.topBackground} />

      <View style={styles.header}>
        <View style={styles.curveOverlay} />

        {/* Using your existing image setup */}
        <Image source={Logo} style={styles.logo} resizeMode="contain" />
        
        <Spacer height={15} />
        <ThemedText title style={styles.heading}>
          Your Account
        </ThemedText>

        <View style={styles.spacerSmall} />
      </View>

      <View style={styles.content}>
        <ThemedText>You have # donations</ThemedText>
      </View>
    </ThemedView>
  )
}

export default Profile

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  topBackground: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: 250,
    backgroundColor: '#4A90E2',
    zIndex: 0,
  },
  header: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    paddingTop: 30,
  },
  curveOverlay: {
    position: 'absolute',
    top: 160, 
    left: -width * 0.15,
    width: width * 1.3,
    height: 475,
    backgroundColor: '#f8f9fa',
    borderRadius: 350,
    zIndex: 0,
  },
  logo: {
    width: 150, 
    height: 150,
    zIndex: 1,
    marginTop: 40,
  },
  heading: {
    fontWeight: 'bold',
    fontSize: 20, // same as Home heading
    marginTop: 30,
    zIndex: 1,
    color: 'black',
    textAlign: 'center',
  },
  spacerSmall: {
    height: 8,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
