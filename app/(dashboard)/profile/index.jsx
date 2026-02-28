import { StyleSheet, View, Image, Dimensions, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { database } from '../../../lib/appwrite';


import { useRouter } from 'expo-router'; 
import { useUser } from '../../../hooks/useUser';

import ThemedText from "../../../components/ThemedText";
import ThemedView from "../../../components/ThemedView";
import ThemedLogo from '../../../components/ThemedLogo';
import ThemedButton from "../../../components/ThemedButton";
import Spacer from "../../../components/Spacer";

const { width } = Dimensions.get('window');

const Profile = () => {
  const router = useRouter(); 
  const { logout, user, authChecked } = useUser();
  async function fetchUserLabel(userId) {
    const doc = await database.getDocument("users", userId);
    return doc.label;
  }

  if (!authChecked) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Spacer height={10} />
        <ThemedText title>Loading profile...</ThemedText>
      </ThemedView>
    );
  }

  if (!user) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ThemedText title>No user logged in</ThemedText>
        <Spacer height={10} />
        <ThemedText>Try logging in again.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.topBackground} />

      <View style={styles.header}>
        <View style={styles.curveOverlay} />
        <Spacer />
        <Image
          source={require('../../../assets/icons/profile.png')}
          style={styles.profileImage}
        />

        <Spacer height={5} />
        <ThemedText title style={styles.heading}>
          {user.name}
        </ThemedText>
        

        <Spacer height={5} />
        <ThemedText title style={styles.subheading}>
          {user.label}
        </ThemedText>

        <Spacer height={5} />

      </View>

      
      <View style={styles.rowButtons}>
        <ThemedButton 
          style={[styles.button, { backgroundColor: '#415ba8ff' }]} 
         onPress={() => router.push('/(dashboard)/profile/requests')}
        >
         <Text style={[styles.buttonText, { color: '#f2f2f2' }]}>Requests</Text>
        </ThemedButton>

        <ThemedButton 
         style={[styles.button, { backgroundColor: '#f2f2f2', borderWidth: 2, borderColor: '#415ba8ff' }]} 
        onPress={() => router.push('/(dashboard)/profile/donations')}
        >
         <Text style={[styles.buttonText, { color: '#415ba8ff' }]}>Donations</Text>
        </ThemedButton>
      </View>

      <ThemedButton style={styles.button} onPress={() => router.push('/(dashboard)/profile/wishlist')}>
        <Text style={styles.buttonText}>Wishlist</Text>
      </ThemedButton>
      <Spacer height={10} />
      
      <TouchableOpacity 
        style={styles.settingsButton}
        onPress={() => router.push('/(dashboard)/profile/settings')}
      >
        <Ionicons name="settings-outline" size={30} color="#f2f2f2" />
      </TouchableOpacity>

      {/* (Currently hiding logout button on profile page)
      <TouchableOpacity 
        style={styles.logoutButton}
        onPress={logout}
      >
        <Ionicons name="log-out-outline" size={30} color="#f2f2f2" />
      </TouchableOpacity>
      */}


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

  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 100, 
    marginTop: 25,
    zIndex: 1,
    backgroundColor: '#bcd7f5ff', 
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

  subheading: {
    fontSize: 18,       
    fontWeight: '500',    
    color: '#555',        
    textAlign: 'center',
    marginTop: 4,       
    zIndex: 1,
    maxWidth: "65%"
},

  button: {
    width: "50%",
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginVertical: 6,
    borderRadius: 30
  },

  rowButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '65%', 
    alignSelf: 'center',
    marginVertical: 10,
    gap: 20, 
  },

  buttonText: {
    color: '#f2f2f2',
    fontSize: 18,   
    fontWeight: '600',
},

  // specialized buttons

  settingsButton: {
    position: 'absolute',
    bottom: 35,
    left: 35,
    width: 55,
    height: 55,
    borderRadius: 12,
    backgroundColor: '#415ba8ff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoutButton: {
    position: 'absolute',
    bottom: 35,
    left: 105,
    width: 55,
    height: 55,
    borderRadius: 12,
    backgroundColor: '#415ba8ff',
    alignItems: 'center',
    justifyContent: 'center',
  },

});

