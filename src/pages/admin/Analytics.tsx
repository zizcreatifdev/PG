import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const followersData = [
  { mois: 'Jan', followers: 1200 }, { mois: 'Fév', followers: 1450 }, { mois: 'Mar', followers: 1680 },
  { mois: 'Avr', followers: 1920 }, { mois: 'Mai', followers: 2340 }, { mois: 'Juin', followers: 2780 },
];

const engagementData = [
  { mois: 'Jan', taux: 3.2 }, { mois: 'Fév', taux: 4.1 }, { mois: 'Mar', taux: 3.8 },
  { mois: 'Avr', taux: 5.2 }, { mois: 'Mai', taux: 4.9 }, { mois: 'Juin', taux: 6.1 },
];

const postsData = [
  { mois: 'Jan', posts: 12 }, { mois: 'Fév', posts: 15 }, { mois: 'Mar', posts: 18 },
  { mois: 'Avr', posts: 22 }, { mois: 'Mai', posts: 20 }, { mois: 'Juin', posts: 25 },
];

const pieData = [
  { name: 'Brouillon', value: 8, color: '#E4E7F0' },
  { name: 'Validé', value: 15, color: '#0077B6' },
  { name: 'Publié', value: 42, color: '#8FC500' },
];

export default function AdminAnalytics() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground font-body mt-1">Données simulées — aperçu des performances</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card p-6">
          <h3 className="font-heading text-lg font-semibold mb-4">Évolution des followers</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={followersData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4E7F0" />
              <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="followers" stroke="#0077B6" strokeWidth={2} dot={{ fill: '#03045E' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h3 className="font-heading text-lg font-semibold mb-4">Taux d'engagement (%)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={engagementData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4E7F0" />
              <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="taux" stroke="#8FC500" strokeWidth={2} dot={{ fill: '#03045E' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h3 className="font-heading text-lg font-semibold mb-4">Posts publiés par mois</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={postsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4E7F0" />
              <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="posts" fill="#023E8A" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h3 className="font-heading text-lg font-semibold mb-4">Répartition des posts</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
