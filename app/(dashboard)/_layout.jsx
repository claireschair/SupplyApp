import { StyleSheet, View, Text, Image, useColorScheme } from 'react-native';
import React from 'react';
import { Tabs } from 'expo-router';
import { Colors } from '../../constants/Colors';

const DashboardLayout = () => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme] ?? Colors.light;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: theme.navBackground,
          height: 80,
          paddingTop: 10,
        },
        tabBarItemStyle: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
      }}
    >
      {/* Home Tab */}
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconContainer}>
              <Image
                source={require('../../assets/icons/home.png')}
                resizeMode="contain"
                style={styles.icon}
              />
              <Text style={[styles.label, { color: focused ? '#e32f45' : '#748c94' }]}>
                Home
              </Text>
            </View>
          ),
        }}
      />

      {/* Map Tab */}
      <Tabs.Screen
        name="map"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconContainer}>
              <Image
                source={require('../../assets/icons/map.png')}
                resizeMode="contain"
                style={styles.icon}
              />
              <Text style={[styles.label, { color: focused ? '#e32f45' : '#748c94' }]}>
                Map
              </Text>
            </View>
          ),
        }}
      />

      {/* Donate Tab */}
      <Tabs.Screen
        name="donate"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconContainer}>
              <Image
                source={require('../../assets/icons/donate.png')}
                resizeMode="contain"
                style={styles.icon}
              />
              <Text style={[styles.label, { color: focused ? '#e32f45' : '#748c94' }]}>
                Donate
              </Text>
            </View>
          ),
        }}
      />

      {/* Receive Tab */}
      <Tabs.Screen
        name="receive"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconContainer}>
              <Image
                source={require('../../assets/icons/receive.png')}
                resizeMode="contain"
                style={styles.icon}
              />
              <Text style={[styles.label, { color: focused ? '#e32f45' : '#748c94' }]}>
                Receive
              </Text>
            </View>
          ),
        }}
      />

      {/* Profile Tab */}
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconContainer}>
              <Image
                source={require('../../assets/icons/profile.png')}
                resizeMode="contain"
                style={styles.icon}
              />
              <Text style={[styles.label, { color: focused ? '#e32f45' : '#748c94' }]}>
                Profile
              </Text>
            </View>
          ),
        }}
      />
    </Tabs>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%', 
  },
  icon: {
    width: 25,
    height: 25,
    marginBottom: 3,
  },
  label: {
    fontSize: 11,
    textAlign: 'center',
  },
});

export default DashboardLayout;
