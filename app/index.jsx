import { StyleSheet, Text, View, Image } from 'react-native'
import { Link } from 'expo-router'

import Logo from '../assets/img/instagram.png'


const Home = () => {
  return (
    <View style={styles.container}>

      <Image source={Logo} style={styles.img}/>

      <Text style={[styles.title, {color: 'purple'}]}>Instagram Knockoff!!!</Text>


      <Text style = {{marginTop: 10, marginBottom: 13}}>
        #1 school supply app trust
      </Text>

      
      <View style = {styles.card}>
        <Link href = "/about">About Page</Link>
      </View>

      <View style = {styles.card}>
        <Link href = "/contact">Contact Page</Link>
      </View>


    </View>
    )

}

export default Home

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'

    },
    title: {
        fontWeight: 'bold',
        fontSize: 18
    },
    card: {
        backgroundColor: '#eee',
        padding: 20,
        borderRadius: 5,
        boxShadow: '4px 4px rgba(0,0,0,0.1)',
        marginVertical: 10,
    },
    img: {
        width: 50,
        height: 50,
        resizeMode: 'contain',
        marginVertical: 20
    }
})