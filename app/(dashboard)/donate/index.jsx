import { StyleSheet, View, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router'; 

import ThemedText from "../../../components/ThemedText";
import ThemedView from "../../../components/ThemedView";
import Spacer from "../../../components/Spacer";

import DonateIcon from "../../../assets/icons/donate.png";

const { width } = Dimensions.get('window');

const Receive = () => {
  const router = useRouter(); 

  return (
    <ThemedView style={styles.container}>
      <View style={styles.topBackground} />

      <View style={styles.header}>
        <View style={styles.curveOverlay} />
        <Image source={DonateIcon} style={styles.logo} resizeMode="contain" />
        <Spacer height={15} />

        <ThemedText title style={styles.heading}>
          Donate
        </ThemedText>
        <Spacer height={30} />

        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={styles.squareButton}
            onPress={() => router.push('/(dashboard)/donate/form')}
          >
            <Ionicons name="document-text-outline" size={60} color="#f2f2f2" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.squareButton}
            onPress={() => router.push('/(dashboard)/map')}
          >
            <Ionicons name="location-outline" size={60} color="#f2f2f2" />
          </TouchableOpacity>
        </View>

        <View style={styles.textRow}>
          <ThemedText style={styles.buttonLabel}>Donation Form</ThemedText>
          <ThemedText style={styles.buttonLabel}>Donation Spots Near Me</ThemedText>
        </View>

        <Spacer height={30} />

        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={styles.squareButton}
            onPress={() => router.push('/(dashboard)/donate/wishlist')}
          >
            <Ionicons name="heart-circle-outline" size={60} color="#f2f2f2" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.squareButton}
            onPress={() => router.push('/(dashboard)/donate/donationlist')}
          >
            <Ionicons name="list-outline" size={60} color="#f2f2f2" />
          </TouchableOpacity>
        </View>

        <View style={styles.textRow}>
          <ThemedText style={styles.buttonLabel}>View Wishlists</ThemedText>
          <ThemedText style={styles.buttonLabel}>Manage Your Donations</ThemedText>
        </View>

      </View>
    </ThemedView>
  );
};

export default Receive;

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

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 35, 
  },

  textRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 35,
    marginTop: 8,
  },

  squareButton: {
    width: 130,
    height: 130,
    backgroundColor: '#415ba8ff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonLabel: {
    textAlign: 'center',
    width: 130,
  },
});
