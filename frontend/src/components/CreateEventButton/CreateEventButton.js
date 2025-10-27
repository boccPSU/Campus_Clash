import React, { useState } from "react";
import { Button, Modal, Form, InputGroup, Spinner } from "react-bootstrap";

export default function CreateEventButton({ onCreated }) {
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  // form fields
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [xp, setXp] = useState(0);

  const reset = () => {
    setTitle("");
    setSubtitle("");
    setDescription("");
    setLocation("");
    setXp(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("http://localhost:5000/api/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subtitle: subtitle || null,
          description: description || null,
          location: location || null,
          xp: Number(xp) || 0,
        }),
      });
      const data = await res.json();
      if (res.ok && data.successful) {
        if (onCreated) onCreated(data.event ?? { eid: data.eid, title, subtitle, description, location, xp });
        setShow(false);
        reset();
      } else {
        // keep it simple per your request—just alert
        alert("Failed to create event");
      }
    } catch {
      alert("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button variant="primary" onClick={() => setShow(true)}>
        + New Event
      </Button>

      <Modal show={show} onHide={() => setShow(false)} centered>
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>Create Event</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <Form.Group className="mb-3" controlId="evTitle">
              <Form.Label>Title</Form.Label>
              <Form.Control
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Hackathon Kickoff"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="evSubtitle">
              <Form.Label>Subtitle (optional)</Form.Label>
              <Form.Control
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Short tagline"
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="evDescription">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this event about?"
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="evLocation">
              <Form.Label>Location</Form.Label>
              <Form.Control
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Burke 205"
              />
            </Form.Group>

            <InputGroup className="mb-3">
              <InputGroup.Text>XP</InputGroup.Text>
              <Form.Control
                type="number"
                min={0}
                step={50}
                value={xp}
                onChange={(e) => setXp(e.target.value)}
              />
            </InputGroup>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="outline-secondary" onClick={() => setShow(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !title}>
              {saving ? <Spinner animation="border" size="sm" /> : "Create"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
}
