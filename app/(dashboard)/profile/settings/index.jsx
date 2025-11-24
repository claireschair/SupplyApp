import { StyleSheet, View, Switch, TouchableOpacity } from 'react-native';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

import { useRouter } from "expo-router";
import { useUser } from '../../../../hooks/useUser';


import Spacer from "../../../../components/Spacer"
import ThemedText from "../../../../components/ThemedText"
import ThemedView from "../../../../components/ThemedView"

const Settings = () => {
  
  const router = useRouter(); 
  const { logout } = useUser();
  const [darkMode, setDarkMode] = React.useState(false);
  const [notif, setNotif] = React.useState(false);

  return (
    <ThemedView style={styles.container}>

      <Spacer height={30} />
      <ThemedText title={true} style={styles.heading}>
        Settings
      </ThemedText>

      <Spacer height={30} />

      <View style={styles.row}>
        <View style={styles.leftContainer}>
          <Ionicons name="notifications-outline" size={20} color="black" />
          <ThemedText>Notifications</ThemedText>
        </View>
        <Switch
          value={notif}
          onValueChange={setNotif}
        />
      </View>
      
      <Spacer height={10} />

      <View style={styles.row}>
        <View style={styles.leftContainer}>
          <Ionicons name="sunny-outline" size={20} color="black" />
          <ThemedText>Dark Mode</ThemedText>
        </View>
        <Switch
          value={darkMode}
          onValueChange={setDarkMode}
        />
      </View>

      <Spacer height={10} />
      
      <TouchableOpacity onPress={() => router.push("/(dashboard)/profile/settings/terms")}>
        <View style={styles.row}>
          <View style={styles.leftContainer}>
            <Ionicons name="newspaper-outline" size={20} color="black" />
            <ThemedText>Terms and Conditions</ThemedText>
          </View>
        </View>
      </TouchableOpacity>

      <Spacer height={10} />
      
      <TouchableOpacity onPress={() => router.push("/(dashboard)/profile/settings/privacy")}>
        <View style={styles.row}>
          <View style={styles.leftContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="black" />
            <ThemedText>Privacy Policy</ThemedText>
          </View>
        </View>
      </TouchableOpacity>

      <Spacer height={10} />
      
      <TouchableOpacity onPress={() => router.push("/(dashboard)/profile/settings/feedback")}>
        <View style={styles.row}>
          <View style={styles.leftContainer}>
            <Ionicons name="chatbox-ellipses-outline" size={20} color="black" />
            <ThemedText>Feedback Form</ThemedText>
          </View>
        </View>
      </TouchableOpacity>

      <Spacer height={10} />
      
      <TouchableOpacity onPress={() => router.push("/(dashboard)/profile/settings/contact")}>
        <View style={styles.row}>
          <View style={styles.leftContainer}>
            <Ionicons name="people-outline" size={20} color="black" />
            <ThemedText>Contact</ThemedText>
          </View>
        </View>
      </TouchableOpacity>

      <Spacer height={10} />
      
      <TouchableOpacity onPress={logout}>
        <View style={styles.row}>
          <View style={styles.leftContainer}>
            <Ionicons name="log-out-outline" size={20} color="black" />
            <ThemedText>Logout</ThemedText>
          </View>
        </View>
      </TouchableOpacity>

      

    </ThemedView>
  )
}

export default Settings;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heading: {
    fontWeight: "bold",
    fontSize: 26,
    textAlign: "center",
  },
  section: {
    marginTop: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    minHeight: 60
  }
});
