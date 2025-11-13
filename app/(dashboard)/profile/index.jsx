import { StyleSheet, View, Image, Dimensions, Text } from 'react-native';
import { useRouter } from 'expo-router'; 
import ThemedText from "../../../components/ThemedText";
import ThemedView from "../../../components/ThemedView";
import Spacer from "../../../components/Spacer";
import Logo from '../../../assets/logo/logo_light.png';
import { useUser } from '../../../hooks/useUser';
import ThemedButton from "../../../components/ThemedButton";

const { width } = Dimensions.get('window');

const Profile = () => {
  const router = useRouter(); 
  const { logout } = useUser(); 

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
        <Spacer height={10} />
      </View>

      <ThemedButton style={styles.button} onPress={() => router.push('/(dashboard)/profile/requests')}>
        <Text>Requests</Text>
      </ThemedButton>

      <ThemedButton style={styles.button} onPress={() => router.push('/(dashboard)/profile/donations')}>
        <Text>Donations</Text>
      </ThemedButton>

      <ThemedButton style={styles.button} onPress={() => router.push('/(dashboard)/profile/wishlist')}>
        <Text>Wishlist</Text>
      </ThemedButton>


      <ThemedButton onPress={logout} style={styles.button}>
        <Text style={{ color: '#f2f2f2' }}>Logout</Text>
      </ThemedButton>
    </ThemedView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
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
    fontSize: 30,
    marginTop: 20,
    zIndex: 1,
    color: 'black',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: "80%",
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  }
});
