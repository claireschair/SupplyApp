import { Keyboard, StyleSheet, Text, TouchableWithoutFeedback, TouchableOpacity, View } from 'react-native'
import { Link } from 'expo-router'
import { useState } from 'react'
import { Colors } from '../../constants/Colors'

import ThemedView from '../../components/ThemedView'
import ThemedText from '../../components/ThemedText'
import Spacer from '../../components/Spacer'
import ThemedButton from '../../components/ThemedButton'
import ThemedTextInput from "../../components/ThemedTextInput"
import { useUser } from '../../hooks/useUser'

const LABEL_OPTIONS = ['Teacher', 'Student', 'Other'];

const Register = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState()
  const [label, setLabel] = useState("")
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const {register} = useUser()

  const handleSubmit = async () => {
    setError(null)
    
    if (!label) {
      setError("Please select your role (Teacher/Student/Other)")
      return
    }
    
    try {
      await register(email, password, name, label.toLowerCase())
    } catch(error) {
      setError(error.message)
    }
  }

  const handleSelectLabel = (selectedLabel) => {
    setLabel(selectedLabel)
    setDropdownOpen(false)
  }

  return (
    <TouchableWithoutFeedback onPress={() => {
      Keyboard.dismiss()
      setDropdownOpen(false)
    }}>
      <ThemedView style={styles.container}>

        <Spacer />
        <ThemedText title={true} style={styles.title}>
          Register an Account
        </ThemedText>

        <Spacer />

        <ThemedTextInput
          style={{ marginBottom: 20, width: "80%" }}
          placeholder="Name"
          value={name}
          onChangeText={setName}
        />

        <View style={styles.dropdownContainer}>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setDropdownOpen(!dropdownOpen)}
          >
            <ThemedText style={label ? styles.selectedText : styles.placeholderText}>
              {label || "Select Role"}
            </ThemedText>
            <ThemedText style={styles.arrow}>▼</ThemedText>
          </TouchableOpacity>

          {dropdownOpen && (
            <View style={styles.dropdownMenu}>
              {LABEL_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.dropdownItem}
                  onPress={() => handleSelectLabel(option)}
                >
                  <ThemedText style={label === option && styles.selectedOptionText}>
                    {option}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <ThemedTextInput
          style={{ marginBottom: 20, width: "80%" }}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />

        <ThemedTextInput
          style={{ marginBottom: 20, width: "80%" }}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <ThemedButton onPress={handleSubmit}>
          <Text style={{ color: '#f2f2f2' }}>Register</Text>
        </ThemedButton>

        <Spacer />
        {error && <Text style={styles.error}>{error}</Text>}

        <Spacer height={100} />
        <Link href="/login" replace>
          <ThemedText style={{ textAlign: "center" }}>
            Login instead
          </ThemedText>
        </Link>

      </ThemedView>
    </TouchableWithoutFeedback>
  )
}

export default Register

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  title: {
    textAlign: "center",
    fontSize: 18,
    marginBottom: 30
  },
  error: {
    color: Colors.warning,
    padding: 10,
    backgroundColor: '#f5c1c8',
    borderColor: Colors.warning,
    borderWidth: 1,
    borderRadius: 6,
    marginHorizontal: 10,
  },
  dropdownContainer: {
    width: "80%",
    marginBottom: 20,
    zIndex: 1000,
  },
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 15,
  },
  placeholderText: {
    color: "#999",
  },
  selectedText: {
    color: "#111",
  },
  arrow: {
    fontSize: 12,
    color: "#666",
  },
  dropdownMenu: {
    position: "absolute",
    top: 55,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  selectedOptionText: {
    fontWeight: "bold",
    color: "#007AFF",
  },
});