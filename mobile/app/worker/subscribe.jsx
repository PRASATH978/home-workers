import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native'
import { useSelector } from 'react-redux'
import { LinearGradient } from 'expo-linear-gradient'
import api from '../../src/utils/api'
import Toast from 'react-native-toast-message'

const PLANS = [
  {
    key:'basic', name:'Basic', price:0, icon:'🔧',
    colors:['#121212','#0d0d0d'],
    features:['5 leads/month','Basic listing','Reviews'],
  },
  {
    key:'pro', name:'Pro', price:199, icon:'⚡',
    colors:['#1a0533','#2d0a4e'],
    border:'#833ab4',
    features:['Unlimited leads','Priority search','WhatsApp alerts','Reviews'],
  },
  {
    key:'featured', name:'Featured', price:499, icon:'👑',
    colors:['#1a0533','#2d1050'],
    border:'#c13584',
    highlight:true,
    features:['Everything in Pro','Top of search','Featured badge','Priority support'],
  },
]

export default function WorkerSubscribeScreen() {
  const { profile } = useSelector(s => s.workers)

  const handleSubscribe = async (plan) => {
    if (plan.key === 'basic') return
    try {
      const { data } = await api.post('/payments/subscription/', { plan: plan.key })
      Toast.show({ type:'info', text1:'Payment initiated', text2:`Order: ${data.order_id}`, visibilityTime:4000 })
    } catch {
      Toast.show({ type:'error', text1:'Failed to initiate payment' })
    }
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <LinearGradient colors={['#1a0533','#000']} style={styles.header}>
        <View style={styles.headerCircle} />
        <Text style={styles.headerTitle}>Upgrade Plan</Text>
        <Text style={styles.headerSub}>More leads = more earnings 💰</Text>
        {profile && (
          <View style={styles.currentPlan}>
            <Text style={styles.currentPlanText}>
              Current: <Text style={{ color:'#c13584', fontWeight:'700' }}>{profile.subscription_plan?.toUpperCase()}</Text>
            </Text>
          </View>
        )}
      </LinearGradient>

      {/* Plans */}
      {PLANS.map(plan => (
        <View key={plan.key} style={{ borderRadius:24, overflow:'hidden', marginBottom:14 }}>
          <LinearGradient
            colors={plan.colors}
            style={[styles.planCard, plan.border && { borderColor: plan.border + '50', borderWidth:1.5 }]}
          >
            {plan.highlight && (
              <LinearGradient
                colors={['#833ab4','#c13584','#fd1d1d']}
                start={{ x:0,y:0 }} end={{ x:1,y:0 }}
                style={styles.popularBadge}
              >
                <Text style={styles.popularText}>✨ Most Popular</Text>
              </LinearGradient>
            )}

            <View style={styles.planTop}>
              <LinearGradient
                colors={plan.highlight ? ['#833ab4','#c13584'] : plan.key === 'pro' ? ['#405de6','#833ab4'] : ['#363636','#262626']}
                style={styles.planIcon}
              >
                <Text style={{ fontSize:24 }}>{plan.icon}</Text>
              </LinearGradient>
              <View>
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planPrice}>
                  {plan.price === 0 ? 'Free Forever' : `₹${plan.price}/month`}
                </Text>
              </View>
            </View>

            {plan.features.map(f => (
              <View key={f} style={styles.featureRow}>
                <LinearGradient colors={['#833ab4','#c13584']} style={styles.featureDot}>
                  <Text style={{ color:'#fff', fontSize:9, fontWeight:'800' }}>✓</Text>
                </LinearGradient>
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}

            <TouchableOpacity
              onPress={() => handleSubscribe(plan)}
              disabled={profile?.subscription_plan === plan.key || plan.key === 'basic'}
              style={{ borderRadius:16, overflow:'hidden', marginTop:16 }}
              activeOpacity={0.85}
            >
              {profile?.subscription_plan === plan.key ? (
                <View style={styles.activePlanBtn}>
                  <Text style={styles.activePlanText}>✅ Current Plan</Text>
                </View>
              ) : plan.key === 'basic' ? (
                <View style={[styles.activePlanBtn, { opacity:0.5 }]}>
                  <Text style={styles.activePlanText}>Free Plan</Text>
                </View>
              ) : (
                <LinearGradient
                  colors={plan.highlight ? ['#833ab4','#c13584','#fd1d1d'] : ['#405de6','#833ab4']}
                  start={{ x:0,y:0 }} end={{ x:1,y:0 }}
                  style={styles.subscribeBtn}
                >
                  <Text style={styles.subscribeBtnText}>Get {plan.name} — ₹{plan.price}/mo</Text>
                </LinearGradient>
              )}
            </TouchableOpacity>
          </LinearGradient>
        </View>
      ))}

      {/* Earnings breakdown */}
      <LinearGradient colors={['#1a0533','#0d0d0d']} style={styles.earningsCard}>
        <Text style={styles.earningsTitle}>💰 How Earnings Work</Text>
        <View style={styles.earningsRow}>
          {[
            { val:'10%',  label:'Platform fee\n(Basic)',    color:'#c13584' },
            { val:'₹450', label:'You keep on\n₹500 job',   color:'#00ba7c' },
            { val:'₹0',   label:'No fee on\nPro plan',     color:'#833ab4' },
          ].map(e => (
            <View key={e.val} style={styles.earningItem}>
              <Text style={[styles.earningVal, { color: e.color }]}>{e.val}</Text>
              <Text style={styles.earningLabel}>{e.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root:    { flex:1, backgroundColor:'#000' },
  content: { paddingHorizontal:16, paddingBottom:40 },

  header:       { marginHorizontal:-16, paddingHorizontal:24, paddingTop:56, paddingBottom:28, alignItems:'center', marginBottom:20, overflow:'hidden' },
  headerCircle: { position:'absolute', top:-50, right:-50, width:180, height:180, borderRadius:90, backgroundColor:'#833ab4', opacity:0.2 },
  headerTitle:  { color:'#fff', fontSize:28, fontWeight:'800', marginBottom:6 },
  headerSub:    { color:'#a8a8a8', fontSize:14 },
  currentPlan:  { backgroundColor:'rgba(193,53,132,0.1)', borderRadius:20, paddingHorizontal:16, paddingVertical:6, marginTop:12, borderWidth:1, borderColor:'#c13584' + '30' },
  currentPlanText:{ color:'#a8a8a8', fontSize:13 },

  planCard:     { padding:20, borderRadius:24, borderWidth:1, borderColor:'#262626' },
  popularBadge: { alignSelf:'flex-start', paddingHorizontal:12, paddingVertical:5, borderRadius:20, marginBottom:14 },
  popularText:  { color:'#fff', fontSize:11, fontWeight:'700' },
  planTop:      { flexDirection:'row', alignItems:'center', gap:14, marginBottom:16 },
  planIcon:     { width:52, height:52, borderRadius:16, alignItems:'center', justifyContent:'center' },
  planName:     { color:'#fff', fontSize:20, fontWeight:'800', marginBottom:3 },
  planPrice:    { color:'#c13584', fontSize:14, fontWeight:'600' },

  featureRow:  { flexDirection:'row', alignItems:'center', gap:10, marginBottom:10 },
  featureDot:  { width:18, height:18, borderRadius:9, alignItems:'center', justifyContent:'center' },
  featureText: { color:'#a8a8a8', fontSize:13, flex:1 },

  activePlanBtn:   { backgroundColor:'#1a1a1a', paddingVertical:13, alignItems:'center', borderRadius:16, borderWidth:1, borderColor:'#262626' },
  activePlanText:  { color:'#737373', fontWeight:'600', fontSize:13 },
  subscribeBtn:    { paddingVertical:14, alignItems:'center', borderRadius:16 },
  subscribeBtnText:{ color:'#fff', fontWeight:'700', fontSize:14 },

  earningsCard: { borderRadius:22, padding:20, marginTop:4, borderWidth:1, borderColor:'#262626' },
  earningsTitle:{ color:'#fff', fontSize:15, fontWeight:'700', marginBottom:16 },
  earningsRow:  { flexDirection:'row', gap:10 },
  earningItem:  { flex:1, backgroundColor:'#0d0d0d', borderRadius:16, padding:14, alignItems:'center', borderWidth:1, borderColor:'#1a1a1a' },
  earningVal:   { fontSize:20, fontWeight:'800', marginBottom:6 },
  earningLabel: { color:'#737373', fontSize:11, textAlign:'center', lineHeight:16 },
})
