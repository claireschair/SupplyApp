import { StyleSheet, View, Image } from 'react-native'
import ThemedLogo from "../../components/ThemedLogo"
import ThemedText from "../../components/ThemedText"
import ThemedView from "../../components/ThemedView"
import Spacer from "../../components/Spacer"

// Replace with your actual logo import
import Logo from '../../assets/logo/logo_light.png'

const Profile = () => {
  return (
    <ThemedView style={styles.container}>

      <View style={styles.topBackground} />

      <View style={styles.header}>

        <View style={styles.curveOverlay} />

        <Image source={Logo} style={styles.logo} resizeMode="contain" />
        
        <Spacer height={15} />
        <ThemedText title style={styles.heading}>
          Your Account
        </ThemedText>

        <View style={styles.spacerSmall} />
      </View>

      {/* Main content */}
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
    height: 50,
    backgroundColor: '#4A90E2',
  },
  header: {
    width: '100%',
    height: 180,
    backgroundColor: '#4A90E2',
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end', 
    paddingBottom: 20,
  },
  curveOverlay: {
    position: 'absolute',
    bottom: -90,
    width: '120%',
    height: 180,
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 200,
    borderTopRightRadius: 200,
    alignSelf: 'center',
    zIndex: 0,          
  },
  logo: {
    width: 100,
    height: 100,
    zIndex: 1,         
  },
  heading: {
    fontWeight: 'bold',
    fontSize: 20,
    marginTop: -10,
    zIndex: 1,
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
