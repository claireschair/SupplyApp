import { StyleSheet, Text, View, Image } from 'react-native'
import { Link } from 'expo-router'

//themed components
import ThemedView from '../components/ThemedView'
import ThemedText from '../components/ThemedText'
import ThemedLogo from '../components/ThemedLogo'
import Spacer from '../components/Spacer'

const Home = () => {
  return (
    <ThemedView style={styles.container}>

      <ThemedLogo />
      <Spacer />

      <ThemedText style={styles.title} title={true}>
        Reserved
      </ThemedText>

      <Spacer height={10}/>
      <ThemedText style = {{marginTop: 10, marginBottom: 13}}>
        #1 school supply app coming trust
      </ThemedText>
      
      <Link href = "/login" style={styles.link}>
        <ThemedText>Login Page</ThemedText>
      </Link>    

      <Link href = "/register" style={styles.link}>
        <ThemedText>Register Page</ThemedText>
      </Link>

      <Link href = "/profile" style={styles.link}>
        <ThemedText>Profile Page</ThemedText>
      </Link>

    </ThemedView>
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
    },
    link: {
      marginVertical: 10,
      borderBottomWidth: 1
    },
})