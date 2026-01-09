import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
  Button,
  TextField,
} from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { agentsApi, employeesApi } from '../../api';
import { Employee, AgentLocation } from '../../types';
import { format } from 'date-fns';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React Leaflet
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function AgentsPage() {
  const [agents, setAgents] = useState<Employee[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null);
  const [agentRoute, setAgentRoute] = useState<AgentLocation[]>([]);
  const [allLocations, setAllLocations] = useState<
    { agent: Employee; lastLocation?: AgentLocation }[]
  >([]);
  const [viewMode, setViewMode] = useState<'all' | 'route'>('all');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    fetchAgents();
    fetchAllLocations();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await employeesApi.getAll();
      const allEmployees = response.data.data?.employees || [];
      const salesAgents = allEmployees.filter((emp) => emp.role.name === 'SalesAgent');
      setAgents(salesAgents);
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const fetchAllLocations = async () => {
    try {
      const response = await agentsApi.getAllLocations({
        date: format(new Date(), 'yyyy-MM-dd'),
      });
      setAllLocations(response.data.data?.agents || []);
    } catch (error) {
      console.error('Error fetching all locations:', error);
    }
  };

  const fetchAgentRoute = async (agentId: number) => {
    try {
      const response = await agentsApi.getRoute(agentId, {
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      });
      setAgentRoute(response.data.data?.route || []);
    } catch (error) {
      console.error('Error fetching agent route:', error);
    }
  };

  const handleAgentChange = (agentId: number) => {
    setSelectedAgent(agentId);
    fetchAgentRoute(agentId);
  };

  const handleViewAllAgents = () => {
    setViewMode('all');
    setSelectedAgent(null);
    fetchAllLocations();
  };

  const center: [number, number] = [47.9186, 106.9177]; // Ulaanbaatar coordinates

  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Agent Tracking
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                View Options
              </Typography>

              <Button
                variant={viewMode === 'all' ? 'contained' : 'outlined'}
                fullWidth
                onClick={handleViewAllAgents}
                sx={{ mb: 2 }}
              >
                All Agents (Today)
              </Button>

              <Button
                variant={viewMode === 'route' ? 'contained' : 'outlined'}
                fullWidth
                onClick={() => setViewMode('route')}
                sx={{ mb: 2 }}
              >
                Agent Route History
              </Button>

              {viewMode === 'route' && (
                <>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Select Agent</InputLabel>
                    <Select
                      value={selectedAgent || ''}
                      label="Select Agent"
                      onChange={(e) => handleAgentChange(Number(e.target.value))}
                    >
                      {agents.map((agent) => (
                        <MenuItem key={agent.id} value={agent.id}>
                          {agent.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    label="Start Date"
                    type="date"
                    fullWidth
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    sx={{ mb: 2 }}
                    InputLabelProps={{ shrink: true }}
                  />

                  <TextField
                    label="End Date"
                    type="date"
                    fullWidth
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    sx={{ mb: 2 }}
                    InputLabelProps={{ shrink: true }}
                  />

                  {selectedAgent && (
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => fetchAgentRoute(selectedAgent)}
                    >
                      Load Route
                    </Button>
                  )}
                </>
              )}

              {viewMode === 'all' && (
                <Paper sx={{ p: 2, mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Showing last known locations of all active agents for today.
                  </Typography>
                  <Typography variant="h6" sx={{ mt: 1 }}>
                    {allLocations.length} Agent{allLocations.length !== 1 ? 's' : ''} Active
                  </Typography>
                </Paper>
              )}

              {viewMode === 'route' && agentRoute.length > 0 && (
                <Paper sx={{ p: 2, mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Route Points
                  </Typography>
                  <Typography variant="h6">{agentRoute.length}</Typography>
                </Paper>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 9 }}>
          <Card>
            <CardContent sx={{ height: '70vh', p: 0 }}>
              <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {viewMode === 'all' &&
                  allLocations.map((agentData, index) =>
                    agentData.lastLocation ? (
                      <Marker
                        key={index}
                        position={[
                          agentData.lastLocation.latitude,
                          agentData.lastLocation.longitude,
                        ]}
                      >
                        <Popup>
                          <strong>{agentData.agent.name}</strong>
                          <br />
                          Last updated:{' '}
                          {new Date(agentData.lastLocation.recordedAt).toLocaleString()}
                        </Popup>
                      </Marker>
                    ) : null
                  )}

                {viewMode === 'route' && agentRoute.length > 0 && (
                  <>
                    {agentRoute.map((location, index) => (
                      <Marker key={index} position={[location.latitude, location.longitude]}>
                        <Popup>
                          <strong>Point {index + 1}</strong>
                          <br />
                          Time: {new Date(location.recordedAt).toLocaleString()}
                        </Popup>
                      </Marker>
                    ))}
                    <Polyline
                      positions={agentRoute.map((loc) => [loc.latitude, loc.longitude])}
                      color="blue"
                      weight={3}
                    />
                  </>
                )}
              </MapContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
