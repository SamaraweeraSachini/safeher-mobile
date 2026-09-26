import { StyleSheet, Text, View } from 'react-native';

export default function RouteDisclaimer() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Route safety information is based on community-submitted reports and
        may not represent every current risk. Stay aware of your
        surroundings and contact emergency services when immediate
        assistance is required.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FFF3D6',
  },
  text: {
    color: '#5D4B53',
    fontSize: 12,
    lineHeight: 18,
  },
});