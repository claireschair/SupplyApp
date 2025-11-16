import { StyleSheet, View, Image, Text, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useRouter } from 'expo-router'; 

import ThemedText from "../../../components/ThemedText";
import ThemedView from "../../../components/ThemedView";
import ThemedButton from "../../../components/ThemedButton";
import Spacer from "../../../components/Spacer";

import ReceiveIcon from "../../../assets/icons/receive.png";

const { width } = Dimensions.get('window');

const Receive = () => {
  const router = useRouter(); 

  return (
    <ThemedView style={styles.container}>
      <View style={styles.topBackground} />

      <View style={styles.header}>
        <View style={styles.curveOverlay} />
        <Image source={ReceiveIcon} style={styles.logo} resizeMode="contain" />
        <Spacer height={15} />

        <ThemedText title style={styles.heading}>
          Receive
        </ThemedText>
        <Spacer height={30} />


        <View style={styles.buttonRow}>
          <View style={styles.buttonColumn}>
            <TouchableOpacity 
              style={styles.squareButton}
              onPress={() => router.push('/(dashboard)/receive/form')}
            >
              <Ionicons name="document-text-outline" size={60} color="#f2f2f2" />
            </TouchableOpacity>
            <ThemedText style={styles.buttonLabel}>Need Form</ThemedText>
          </View>

          <View style={styles.buttonColumn}>
            <TouchableOpacity 
              style={styles.squareButton}
              onPress={() => router.push('/(dashboard)/map')}
            >
              <Ionicons name="location-outline" size={60} color="#f2f2f2" />
            </TouchableOpacity>
            <ThemedText style={styles.buttonLabel}>Supplies Near Me</ThemedText>
          </View>
        </View>
      </View>

      <Spacer height={40} />

      <ThemedButton 
        style={styles.button} 
        onPress={() => router.push('/(dashboard)/receive/wishlist')}
      >
        <Text style={{ color: '#f2f2f2' }}>Add to Your Wishlist</Text>
      </ThemedButton>
      <Spacer height={10} />
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

  button: {
    width: "75%",
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginVertical: 6,
  },

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '75%',
    alignSelf: 'center',
  },

  buttonColumn: {
    alignItems: 'center',
    justifyContent: 'center',
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
    marginTop: 8,
    textAlign: 'center',
  },
});
