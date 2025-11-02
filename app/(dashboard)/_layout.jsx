import { View, Text, useColorScheme } from 'react-native'
import React from 'react'
import { Tabs } from 'expo-router'
import { Colors } from '../../constants/Colors'

const DashboardLayout = () => {
  const colorScheme = useColorScheme()
  const theme = Colors[colorScheme] ?? Colors.light
  
  return (
    <Tabs 
      screenOptions={{headerShown: false, 
          tabBarStyle: {
          backgroundColor: theme.navBackground,
          padding: 10,
          height: 90,
        },
        tabBarActiveTintColor: theme.iconColorFocused,
        tabBarInactiveTintColor: theme.iconColor
      }}


    >
      <Tabs.Screen 
        name="home" 
        options={{ title: 'Home'}}
      />
      <Tabs.Screen 
        name="map" 
        options={{ title: 'Map'}}
      />
      <Tabs.Screen 
        name="donate" 
        options={{ title: 'Donate'}}
      />
      <Tabs.Screen 
        name="receive" 
        options={{ title: 'Receive'}}
      />
      <Tabs.Screen 
        name="profile" 
        options={{ title: 'Profile'}}
      />


      </Tabs>
  )
}

export default DashboardLayout